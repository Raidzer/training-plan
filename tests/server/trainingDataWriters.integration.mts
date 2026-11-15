import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../../src/server/db/schema";

const CONNECTION = {
  host: "127.0.0.1",
  port: 55432,
  user: "training_test",
  password: "training_test_password",
  database: "training_plan_concurrency",
  connectionTimeoutMillis: 5000,
};
const SCHEMA_NAME = `writer_concurrency_${process.pid}_${Date.now()}`;
const USER_ID = 910001;
const OTHER_USER_ID = 910002;
const ENTRY_ID = 910001;
const DATE = "2026-11-09";
const clients = new Set<Client>();
const databaseContext = new AsyncLocalStorage<NodePgDatabase<typeof schema>>();
const admin = new Client(CONNECTION);
let schemaCreated = false;
let passed = 0;

process.env.DATABASE_URL =
  "postgresql://training_test:training_test_password@127.0.0.1:55432/training_plan_concurrency";
const { db } = await import("../../src/server/db/client");
const { lockTrainingData, isTrainingDataBusyError } =
  await import("../../src/server/trainingDataLock");
const { clearUserTrainingDataById, deleteUserAccountById } =
  await import("../../src/server/adminUsers");
const {
  deletePlanEntriesForDate,
  shiftPlanEntriesFromDate,
  updatePlanEntryText,
  upsertPlanEntriesForDate,
} = await import("../../src/server/plans");
const { upsertRecoveryEntry } = await import("../../src/server/recoveryEntries");
const { upsertWeightEntry } = await import("../../src/server/weightEntries");
const { upsertWorkoutReport } = await import("../../src/server/workoutReports");

for (const method of ["select", "insert", "update", "delete", "transaction"] as const) {
  Object.defineProperty(db, method, {
    configurable: true,
    value: (...args: unknown[]) => {
      const executor = databaseContext.getStore();
      assert.ok(executor, "Queries must use an isolated test connection");
      return Reflect.apply(executor[method], executor, args);
    },
  });
}

async function connect() {
  const client = new Client(CONNECTION);
  await client.connect();
  clients.add(client);
  await client.query(`SET search_path TO "${SCHEMA_NAME}"`);
  await client.query("SET statement_timeout TO '10s'");
  return client;
}

function usingClient<T>(client: Client, run: () => Promise<T>) {
  return databaseContext.run(drizzle(client, { schema }), run);
}

async function reset() {
  await admin.query("TRUNCATE users RESTART IDENTITY CASCADE");
  await admin.query(
    "INSERT INTO users (id, email, login, password_hash, name) VALUES ($1, 'writer@example.test', 'writer', 'fixture', 'Writer'), ($2, 'other@example.test', 'other', 'fixture', 'Other')",
    [USER_ID, OTHER_USER_ID]
  );
  await admin.query(
    "INSERT INTO plan_entries (id, user_id, date, task_text) VALUES ($1, $2, $3, 'Easy run')",
    [ENTRY_ID, USER_ID, DATE]
  );
}

async function check(name: string, run: () => Promise<void>) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function getBackendPid(client: Client) {
  const pid = (await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  return pid;
}

async function waitUntilBlocked(pid: number) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await admin.query<{ blocked: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_locks WHERE pid = $1 AND locktype = 'advisory' AND NOT granted) AS blocked",
      [pid]
    );
    if (result.rows[0].blocked) {
      return;
    }
    await delay(20);
  }
  assert.fail("Writer did not wait for the advisory lock");
}

async function holdUserLock(client: Client) {
  const ready = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const pending = usingClient(client, () =>
    db.transaction(async (tx) => {
      await lockTrainingData(tx, USER_ID);
      ready.resolve();
      await release.promise;
    })
  );
  await Promise.race([ready.promise, pending]);
  return { release: release.resolve, pending };
}

const saveReport = () =>
  upsertWorkoutReport({
    userId: USER_ID,
    planEntryId: ENTRY_ID,
    date: DATE,
    startTime: null,
    resultText: "Completed",
  });
const saveWeight = (userId = USER_ID, weightKg = 70) =>
  upsertWeightEntry({
    userId,
    date: DATE,
    period: "morning",
    weightKg,
  });
const saveRecovery = () =>
  upsertRecoveryEntry({
    userId: USER_ID,
    date: DATE,
    hasBath: true,
    hasMfr: false,
    hasMassage: false,
  });

try {
  assert.match(SCHEMA_NAME, /^writer_concurrency_\d+_\d+$/);
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${SCHEMA_NAME}"`);
  schemaCreated = true;
  await admin.query(`SET search_path TO "${SCHEMA_NAME}"`);
  const journal = JSON.parse(
    await readFile(new URL("../../drizzle/meta/_journal.json", import.meta.url), "utf8")
  ) as { entries: Array<{ tag: string }> };
  for (const { tag } of journal.entries) {
    const migration = await readFile(new URL(`../../drizzle/${tag}.sql`, import.meta.url), "utf8");
    await admin.query(migration.replaceAll('"public".', `"${SCHEMA_NAME}".`));
  }
  const holder = await connect();
  const writer = await connect();
  const other = await connect();
  const writerPid = await getBackendPid(writer);
  const writers = [
    [
      "plan upsert",
      () =>
        upsertPlanEntriesForDate({
          userId: USER_ID,
          date: DATE,
          originalDate: DATE,
          isWorkload: false,
          entries: [{ id: null, taskText: "Run", commentText: null }],
          isEdit: false,
        }),
    ],
    [
      "plan text",
      () =>
        updatePlanEntryText({
          userId: USER_ID,
          entryId: ENTRY_ID,
          taskText: "Updated",
          commentText: null,
        }),
    ],
    [
      "plan shift",
      () => shiftPlanEntriesFromDate({ userId: USER_ID, fromDate: DATE, offsetDays: 1 }),
    ],
    ["plan deletion", () => deletePlanEntriesForDate({ userId: USER_ID, date: DATE })],
    ["report", saveReport],
    ["weight", () => saveWeight()],
    ["recovery", saveRecovery],
    ["training data cleanup", () => clearUserTrainingDataById(USER_ID)],
    ["account deletion", () => deleteUserAccountById(USER_ID)],
  ] as const;

  for (const [name, write] of writers) {
    await check(`${name} waits for the common user lock`, async () => {
      await reset();
      const held = await holdUserLock(holder);
      const pending = usingClient(writer, write);
      try {
        await waitUntilBlocked(writerPid);
        await usingClient(other, () => saveWeight(OTHER_USER_ID));
      } finally {
        held.release();
        await held.pending;
      }
      await pending;
    });
  }

  await check("parallel manual writers create one record per key", async () => {
    await reset();
    await Promise.all([
      usingClient(writer, () => saveWeight(USER_ID, 70)),
      usingClient(other, () => saveWeight(USER_ID, 71)),
    ]);
    await Promise.all([usingClient(writer, saveRecovery), usingClient(other, saveRecovery)]);
    await Promise.all([usingClient(writer, saveReport), usingClient(other, saveReport)]);
    for (const table of ["weight_entries", "recovery_entries", "workout_reports"]) {
      const result = await admin.query<{ count: string }>(
        `SELECT count(*) FROM ${table} WHERE user_id = $1`,
        [USER_ID]
      );
      assert.equal(result.rows[0].count, "1");
    }
  });

  await check("report rechecks the date after waiting for a shifted plan", async () => {
    await reset();
    const held = await holdUserLock(holder);
    await holder.query("UPDATE plan_entries SET date = '2026-11-10' WHERE id = $1", [ENTRY_ID]);
    const report = usingClient(writer, saveReport);
    const rejected = assert.rejects(report, /date_mismatch/);
    try {
      await waitUntilBlocked(writerPid);
    } finally {
      held.release();
      await held.pending;
    }
    await rejected;
    assert.equal((await admin.query("SELECT 1 FROM workout_reports")).rowCount, 0);
  });

  await check(
    "sleep-only update waits for the lock and preserves imported recovery fields",
    async () => {
      await reset();
      const held = await holdUserLock(holder);
      const sleep = usingClient(writer, () =>
        upsertRecoveryEntry({ userId: USER_ID, date: DATE, sleepHours: 7.5 })
      );
      try {
        await waitUntilBlocked(writerPid);
        await holder.query(
          "INSERT INTO recovery_entries (user_id, date, has_bath, has_mfr, has_massage, recovery_other, sleep_hours, additional_sleep_hours, overall_score) VALUES ($1, $2, true, false, true, 'Imported recovery', 8, 0.5, 7)",
          [USER_ID, DATE]
        );
      } finally {
        held.release();
        await held.pending;
      }
      await sleep;
      const recovery = await admin.query(
        "SELECT has_bath, has_mfr, has_massage, recovery_other, sleep_hours, additional_sleep_hours, overall_score FROM recovery_entries WHERE user_id = $1 AND date = $2",
        [USER_ID, DATE]
      );
      assert.deepEqual(recovery.rows, [
        {
          has_bath: true,
          has_mfr: false,
          has_massage: true,
          recovery_other: "Imported recovery",
          sleep_hours: "7.50",
          additional_sleep_hours: "0.50",
          overall_score: 7,
        },
      ]);
    }
  );

  await check("lock timeout is five seconds and remains transaction-local", async () => {
    await reset();
    const held = await holdUserLock(holder);
    const started = Date.now();
    try {
      await assert.rejects(
        usingClient(writer, () => saveWeight()),
        isTrainingDataBusyError
      );
      assert.ok(Date.now() - started >= 4500, "Expected PostgreSQL lock_timeout near five seconds");
      const setting = await writer.query<{ lock_timeout: string }>("SHOW lock_timeout");
      assert.equal(setting.rows[0].lock_timeout, "0");
    } finally {
      held.release();
      await held.pending;
    }
    await usingClient(writer, () => saveWeight());
  });

  await check("rollback releases the advisory lock and leaves no written data", async () => {
    await reset();
    await assert.rejects(
      usingClient(writer, () =>
        db.transaction(async (tx) => {
          await lockTrainingData(tx, USER_ID);
          await tx.execute(
            sql`update plan_entries set task_text = 'Rolled back' where id = ${ENTRY_ID}`
          );
          throw new Error("rollback_fixture");
        })
      ),
      /rollback_fixture/
    );
    await usingClient(other, () => saveWeight());
    const entry = await admin.query<{ task_text: string }>(
      "SELECT task_text FROM plan_entries WHERE id = $1",
      [ENTRY_ID]
    );
    assert.equal(entry.rows[0].task_text, "Easy run");
  });
} finally {
  await Promise.allSettled([...clients].map((client) => client.end()));
  if (schemaCreated) {
    assert.match(SCHEMA_NAME, /^writer_concurrency_\d+_\d+$/);
    await admin.query("SET search_path TO pg_catalog");
    await admin.query(`DROP SCHEMA "${SCHEMA_NAME}" CASCADE`);
    assert.equal(
      (await admin.query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [SCHEMA_NAME])).rowCount,
      0
    );
  }
  await admin.end();
  await db.$client.end();
}

console.log(`PASS ${passed} PostgreSQL writer checks; isolated schema removed`);
