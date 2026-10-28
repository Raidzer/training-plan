import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../../src/server/db/schema";

const CONNECTION = {
  host: "127.0.0.1",
  port: 5432,
  user: "runlog",
  password: "runlog",
  database: "runlog",
  connectionTimeoutMillis: 3000,
};
const SCHEMA_NAME = `personal_records_it_${process.pid}_${Date.now()}`;
const context = new AsyncLocalStorage<NodePgDatabase<typeof schema>>();
const admin = new Client(CONNECTION);
const worker = new Client(CONNECTION);
let schemaCreated = false;
let passed = 0;

process.env.DATABASE_URL = "postgres://runlog:runlog@127.0.0.1:5432/runlog";
const { db } = await import("../../src/server/db/client");
const { getPersonalRecords, improvePersonalRecord } =
  await import("../../src/server/personalRecords");

for (const method of ["select", "insert", "update"] as const) {
  Object.defineProperty(db, method, {
    configurable: true,
    value: (...args: unknown[]) => {
      const database = context.getStore();
      assert.ok(database, "Production queries must use the isolated test connection");
      return Reflect.apply(database[method], database, args);
    },
  });
}

function improve(timeText: string) {
  return context.run(drizzle(worker, { schema }), () =>
    improvePersonalRecord({
      userId: 1,
      record: { distanceKey: "10k", timeText, recordDate: "2026-10-28", raceName: "New race" },
    })
  );
}

async function records(userId = 1) {
  return context.run(drizzle(worker, { schema }), () => getPersonalRecords({ userId }));
}

async function check(name: string, run: () => Promise<void>) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function waitForLock(backendPid: number) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await admin.query("SELECT pg_stat_clear_snapshot()");
    const result = await admin.query<{ blocked: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid = $1 AND wait_event_type = 'Lock') AS blocked",
      [backendPid]
    );
    if (result.rows[0].blocked) {
      return;
    }
    await delay(20);
  }
  assert.fail("Concurrent record write did not reach the database lock");
}

try {
  assert.match(SCHEMA_NAME, /^personal_records_it_\d+_\d+$/);
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${SCHEMA_NAME}"`);
  schemaCreated = true;
  await admin.query(`SET search_path TO "${SCHEMA_NAME}"`);
  const baseline = await readFile(
    new URL("../../drizzle/0000_redundant_forge.sql", import.meta.url),
    "utf8"
  );
  await admin.query(baseline.replaceAll('"public".', `"${SCHEMA_NAME}".`));
  await admin.query(
    "INSERT INTO users (id, email, login, password_hash, name) VALUES (1, 'owner@example.test', 'owner', 'fixture', 'Owner'), (2, 'other@example.test', 'other', 'fixture', 'Other')"
  );
  await worker.connect();
  await worker.query(`SET search_path TO "${SCHEMA_NAME}"`);
  await worker.query("SET statement_timeout TO '8s'");
  await worker.query("SET lock_timeout TO '5s'");
  const pidResult = await worker.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");

  await check("first result is normalized and stored without previous metadata", async () => {
    assert.equal(await improve("39:30,1"), "updated");
    assert.deepEqual(await records(), [
      {
        distanceKey: "10k",
        timeText: "00:39:30.10",
        recordDate: "2026-10-28",
        raceName: "New race",
        raceCity: null,
        protocolUrl: null,
      },
    ]);
  });

  await check(
    "improvement clears old race data and leaves another athlete/distance intact",
    async () => {
      await admin.query(
        "UPDATE personal_records SET race_city = 'Old city', protocol_url = 'https://example.test/old' WHERE user_id = 1"
      );
      await admin.query(
        "INSERT INTO personal_records (user_id, distance_key, time_text, record_date) VALUES (1, '5k', '00:18:00', '2026-01-01'), (2, '10k', '00:36:00', '2026-01-01')"
      );
      assert.equal(await improve("39:30.09"), "updated");
      const ownRecords = await records();
      const updated = ownRecords.find((record) => record.distanceKey === "10k");
      assert.equal(updated?.raceCity, null);
      assert.equal(updated?.protocolUrl, null);
      assert.equal(ownRecords.find((record) => record.distanceKey === "5k")?.timeText, "00:18:00");
      assert.equal((await records(2))[0].timeText, "00:36:00");
    }
  );

  await check("equal and slower results do not change the current record", async () => {
    const before = await records();
    assert.equal(await improve("00:39:30.09"), "not_better");
    assert.equal(await improve("40:00"), "not_better");
    assert.deepEqual(await records(), before);
  });

  await check("invalid old record is not replaced", async () => {
    await admin.query(
      "UPDATE personal_records SET time_text = '00:00' WHERE user_id = 1 AND distance_key = '10k'"
    );
    assert.equal(await improve("39:00"), "invalid_current_record");
  });

  for (const existing of [false, true]) {
    await check(
      `concurrent ${existing ? "update" : "insert"} preserves the faster result`,
      async () => {
        await admin.query(
          "DELETE FROM personal_records WHERE user_id = 1 AND distance_key = '10k'"
        );
        if (existing) {
          await admin.query(
            "INSERT INTO personal_records (user_id, distance_key, time_text, record_date) VALUES (1, '10k', '00:40:00', '2026-01-01')"
          );
        }
        await admin.query("BEGIN");
        let pending: ReturnType<typeof improve> | undefined;
        try {
          if (existing) {
            await admin.query(
              "UPDATE personal_records SET time_text = '00:38:00' WHERE user_id = 1 AND distance_key = '10k'"
            );
          } else {
            await admin.query(
              "INSERT INTO personal_records (user_id, distance_key, time_text, record_date) VALUES (1, '10k', '00:38:00', '2026-01-01')"
            );
          }
          pending = improve("39:00");
          await waitForLock(pidResult.rows[0].pid);
          await admin.query("COMMIT");
          assert.equal(await pending, "conflict");
        } finally {
          await admin.query("ROLLBACK");
          await pending;
        }
        assert.equal(
          (await records()).find((record) => record.distanceKey === "10k")?.timeText,
          "00:38:00"
        );
      }
    );
  }
} finally {
  await worker.end();
  if (schemaCreated) {
    assert.match(SCHEMA_NAME, /^personal_records_it_\d+_\d+$/);
    await admin.query("SET search_path TO pg_catalog");
    await admin.query(`DROP SCHEMA "${SCHEMA_NAME}" CASCADE`);
    const remaining = await admin.query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [
      SCHEMA_NAME,
    ]);
    assert.equal(remaining.rowCount, 0);
  }
  await admin.end();
  await db.$client.end();
}

console.log(`PASS ${passed} PostgreSQL integration checks; isolated schema removed`);
