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
const SCHEMA_NAME = `shoes_archive_it_${process.pid}_${Date.now()}`;
const DATE = "2026-10-28";
const clients = new Set<Client>();
const databaseContext = new AsyncLocalStorage<NodePgDatabase<typeof schema>>();
const admin = new Client(CONNECTION);
let passed = 0;
let schemaCreated = false;

process.env.DATABASE_URL = "postgres://runlog:runlog@127.0.0.1:5432/runlog";
const { db } = await import("../../src/server/db/client");
const { createShoe, deleteShoe, listShoesByUser, updateShoe } =
  await import("../../src/server/shoes");
const { getWorkoutReportByPlanEntry, upsertWorkoutReport } =
  await import("../../src/server/workoutReports");
const { deletePlanEntriesForDate, upsertPlanEntriesForDate } =
  await import("../../src/server/plans");

for (const method of ["select", "insert", "update", "delete", "transaction"] as const) {
  Object.defineProperty(db, method, {
    configurable: true,
    value: (...args: unknown[]) => {
      const database = databaseContext.getStore();
      assert.ok(database, "Production queries must use an isolated test connection");
      return Reflect.apply(database[method], database, args);
    },
  });
}

async function connect() {
  const client = new Client(CONNECTION);
  await client.connect();
  clients.add(client);
  await client.query(`SET search_path TO "${SCHEMA_NAME}"`);
  await client.query("SET statement_timeout TO '8s'");
  await client.query("SET lock_timeout TO '5s'");
  return client;
}

function usingClient<T>(client: Client, run: () => Promise<T>) {
  return databaseContext.run(drizzle(client, { schema }), run);
}

async function check(name: string, run: () => Promise<void>) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function createEntry(client: Client, userId = 1, date = DATE) {
  const result = await client.query<{ id: number }>(
    "INSERT INTO plan_entries (user_id, date, task_text) VALUES ($1, $2, $3) RETURNING id",
    [userId, date, "Easy run"]
  );
  return result.rows[0].id;
}

function saveReport(
  planEntryId: number,
  extra: Partial<Parameters<typeof upsertWorkoutReport>[0]> = {}
) {
  return upsertWorkoutReport({
    userId: 1,
    planEntryId,
    date: DATE,
    startTime: null,
    resultText: "Completed",
    ...extra,
  });
}

async function currentMileage(client: Client, shoeId: number) {
  const result = await client.query<{ current_mileage_km: string }>(
    "SELECT current_mileage_km FROM shoes WHERE id = $1",
    [shoeId]
  );
  return result.rows[0].current_mileage_km;
}

async function waitForLock(client: Client, backendPid: number) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await client.query<{ blocked: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid = $1 AND wait_event_type = 'Lock') AS blocked",
      [backendPid]
    );
    if (result.rows[0].blocked) {
      return;
    }
    await delay(20);
  }
  assert.fail("Concurrent operation did not wait for the expected database lock");
}

try {
  assert.match(SCHEMA_NAME, /^shoes_archive_it_\d+_\d+$/);
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
  await admin.query(
    "INSERT INTO shoes (user_id, name, current_mileage_km) VALUES (1, 'Before migration', 25)"
  );
  const migration = await readFile(
    new URL("../../drizzle/0008_tired_speedball.sql", import.meta.url),
    "utf8"
  );
  await admin.query(migration);
  const client = await connect();

  await usingClient(client, async () => {
    await check("migration keeps existing shoes active and enforces non-null", async () => {
      const result = await client.query<{ is_archived: boolean; current_mileage_km: string }>(
        "SELECT is_archived, current_mileage_km FROM shoes WHERE name = 'Before migration'"
      );
      assert.deepEqual(result.rows, [{ is_archived: false, current_mileage_km: "25.00" }]);
      await assert.rejects(
        client.query("INSERT INTO shoes (user_id, name, is_archived) VALUES (1, 'Invalid', NULL)"),
        (error: unknown) => (error as { code?: string }).code === "23502"
      );
    });

    const used = await createShoe({
      userId: 1,
      name: "HOKA Clifton 8",
      mileageLimitKm: 100,
      currentMileageKm: 90,
      notifyOnLimitEmail: true,
      notifyOnLimitTelegram: true,
    });
    assert.ok(used);
    const other = await createShoe({ userId: 2, name: "Other owner", currentMileageKm: 10 });
    assert.ok(other);
    const planEntryId = await createEntry(client);

    await check("create and list compute correlated hasReports per shoe and owner", async () => {
      assert.equal(used.isArchived, false);
      assert.equal(used.hasReports, false);
      await saveReport(planEntryId, { shoeUsages: [{ shoeId: used.id, mileageKm: 12 }] });
      const listed = await listShoesByUser(1);
      assert.equal(listed.find((shoe) => shoe.id === used.id)?.hasReports, true);
      assert.equal(listed.find((shoe) => shoe.name === "Before migration")?.hasReports, false);
      assert.equal(
        listed.some((shoe) => shoe.id === other.id),
        false
      );
    });

    await check(
      "archive and restore preserve name, mileage, limit, notifications and history",
      async () => {
        const archived = await updateShoe({ userId: 1, shoeId: used.id, isArchived: true });
        assert.ok(archived);
        assert.equal(archived.isArchived, true);
        assert.equal(archived.hasReports, true);
        assert.equal(archived.name, "HOKA Clifton 8");
        assert.equal(archived.currentMileageKm, "102.00");
        assert.equal(archived.mileageLimitKm, "100.00");
        assert.equal(archived.notifyOnLimitEmail, true);
        assert.equal(archived.notifyOnLimitTelegram, true);
        const report = await getWorkoutReportByPlanEntry({ userId: 1, planEntryId });
        assert.deepEqual(report?.shoes, [
          { id: used.id, name: "HOKA Clifton 8", mileageKm: "12.00" },
        ]);
        const restored = await updateShoe({ userId: 1, shoeId: used.id, isArchived: false });
        assert.equal(restored?.isArchived, false);
        assert.equal(restored?.currentMileageKm, "102.00");
        assert.equal(restored?.notifyOnLimitTelegram, true);
        await updateShoe({ userId: 1, shoeId: used.id, isArchived: true });
      }
    );

    await check(
      "owner checks protect archive, restore, deletion and report associations",
      async () => {
        assert.equal(await updateShoe({ userId: 2, shoeId: used.id, isArchived: false }), null);
        assert.equal(await deleteShoe({ userId: 2, shoeId: used.id }), "not_found");
        await assert.rejects(
          saveReport(planEntryId, {
            resultText: "Must roll back",
            shoeUsages: [{ shoeId: other.id, mileageKm: 3 }],
          }),
          /invalid_shoes/
        );
        assert.equal(
          (await getWorkoutReportByPlanEntry({ userId: 1, planEntryId }))?.resultText,
          "Completed"
        );
        assert.equal(await currentMileage(client, other.id), "10.00");
      }
    );

    await check("used shoes cannot be deleted and free shoes can be deleted", async () => {
      assert.equal(await deleteShoe({ userId: 1, shoeId: used.id }), "in_use");
      const free = await createShoe({ userId: 1, name: "Unused" });
      assert.ok(free);
      assert.equal(await deleteShoe({ userId: 1, shoeId: free.id }), "deleted");
      assert.equal(await deleteShoe({ userId: 1, shoeId: free.id }), "not_found");
      assert.equal(
        (await getWorkoutReportByPlanEntry({ userId: 1, planEntryId }))?.shoes.length,
        1
      );
    });

    await check(
      "existing archived pair accepts mileage corrections without notifications",
      async () => {
        const result = await saveReport(planEntryId, {
          shoeUsages: [{ shoeId: used.id, mileageKm: 15.5 }],
        });
        assert.deepEqual(result.limitExceededShoes, []);
        assert.equal(await currentMileage(client, used.id), "105.50");
        assert.equal(
          (await getWorkoutReportByPlanEntry({ userId: 1, planEntryId }))?.shoes[0]?.mileageKm,
          "15.50"
        );
      }
    );

    await check("omitted shoes preserve archived association and mileage", async () => {
      await saveReport(planEntryId, { resultText: "Edited result" });
      const report = await getWorkoutReportByPlanEntry({ userId: 1, planEntryId });
      assert.equal(report?.resultText, "Edited result");
      assert.equal(report?.shoes[0]?.mileageKm, "15.50");
      assert.equal(await currentMileage(client, used.id), "105.50");
    });

    await check(
      "new archived association rejects and rolls back report, conditions and mileage",
      async () => {
        const newEntryId = await createEntry(client);
        await assert.rejects(
          saveReport(newEntryId, {
            weather: "Rain",
            shoeUsages: [{ shoeId: used.id, mileageKm: 4 }],
          }),
          /archived_shoe/
        );
        assert.equal(
          await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: newEntryId }),
          null
        );
        assert.equal(await currentMileage(client, used.id), "105.50");
        const conditions = await client.query<{ count: string }>(
          "SELECT count(*) FROM workout_report_conditions"
        );
        assert.equal(conditions.rows[0].count, "0");
        await saveReport(newEntryId, { resultText: "Original", weather: "Sunny" });
        await assert.rejects(
          saveReport(newEntryId, {
            resultText: "Invalid edit",
            weather: "Rain",
            shoeUsages: [{ shoeId: used.id, mileageKm: 4 }],
          }),
          /archived_shoe/
        );
        const report = await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: newEntryId });
        assert.equal(report?.resultText, "Original");
        assert.equal(report?.weather, "Sunny");
        assert.deepEqual(report?.shoes, []);
      }
    );

    await check(
      "removing archived association adjusts only its mileage and disallows reattachment",
      async () => {
        await saveReport(planEntryId, { shoeUsages: [] });
        assert.deepEqual(
          (await getWorkoutReportByPlanEntry({ userId: 1, planEntryId }))?.shoes,
          []
        );
        assert.equal(await currentMileage(client, used.id), "90.00");
        assert.equal(
          (await listShoesByUser(1)).find((shoe) => shoe.id === used.id)?.hasReports,
          false
        );
        await assert.rejects(
          saveReport(planEntryId, { shoeUsages: [{ shoeId: used.id, mileageKm: 2 }] }),
          /archived_shoe/
        );
        await updateShoe({ userId: 1, shoeId: used.id, isArchived: false });
        await saveReport(planEntryId, { shoeUsages: [{ shoeId: used.id, mileageKm: 2 }] });
        assert.equal(await currentMileage(client, used.id), "92.00");
      }
    );

    await check(
      "concurrent creation of one report serializes without duplicates or mileage inflation",
      async () => {
        const entryId = await createEntry(client);
        const raceShoe = await createShoe({ userId: 1, name: "Concurrent", currentMileageKm: 0 });
        assert.ok(raceShoe);
        const first = await connect();
        const second = await connect();
        await Promise.all([
          usingClient(first, () =>
            saveReport(entryId, { shoeUsages: [{ shoeId: raceShoe.id, mileageKm: 3 }] })
          ),
          usingClient(second, () =>
            saveReport(entryId, { shoeUsages: [{ shoeId: raceShoe.id, mileageKm: 7 }] })
          ),
        ]);
        const report = await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: entryId });
        assert.ok(report);
        assert.ok(["3.00", "7.00"].includes(report.shoes[0].mileageKm!));
        assert.equal(await currentMileage(client, raceShoe.id), report.shoes[0].mileageKm);
        const count = await client.query<{ count: string }>(
          "SELECT count(*) FROM workout_reports WHERE plan_entry_id = $1",
          [entryId]
        );
        assert.equal(count.rows[0].count, "1");
      }
    );

    await check(
      "save waits for concurrent archive and rejects stale active selection atomically",
      async () => {
        const raceShoe = await createShoe({ userId: 1, name: "Archive race", currentMileageKm: 0 });
        assert.ok(raceShoe);
        const entryId = await createEntry(client);
        const archiver = await connect();
        const saver = await connect();
        const pid = (await saver.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0]
          .pid;
        await archiver.query("BEGIN");
        try {
          const archived = await usingClient(archiver, () =>
            updateShoe({ userId: 1, shoeId: raceShoe.id, isArchived: true })
          );
          assert.equal(archived?.hasReports, false);
          const saving = usingClient(saver, () =>
            saveReport(entryId, { shoeUsages: [{ shoeId: raceShoe.id, mileageKm: 5 }] })
          );
          const rejection = assert.rejects(saving, /archived_shoe/);
          await waitForLock(client, pid);
          await archiver.query("COMMIT");
          await rejection;
        } finally {
          await archiver.query("ROLLBACK");
        }
        assert.equal(await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: entryId }), null);
        assert.equal(await currentMileage(client, raceShoe.id), "0.00");
      }
    );

    await check("deletion waits for a concurrent association and returns in_use", async () => {
      const raceShoe = await createShoe({ userId: 1, name: "Delete race" });
      assert.ok(raceShoe);
      const entryId = await createEntry(client);
      await saveReport(entryId);
      const report = await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: entryId });
      assert.ok(report);
      const creator = await connect();
      const deleter = await connect();
      const pid = (await deleter.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0]
        .pid;
      await creator.query("BEGIN");
      try {
        await creator.query(
          "INSERT INTO workout_report_shoes (workout_report_id, shoe_id, mileage_km) VALUES ($1, $2, 1)",
          [report.id, raceShoe.id]
        );
        const deleting = usingClient(deleter, () => deleteShoe({ userId: 1, shoeId: raceShoe.id }));
        await waitForLock(client, pid);
        await creator.query("COMMIT");
        assert.equal(await deleting, "in_use");
      } finally {
        await creator.query("ROLLBACK");
      }
      assert.equal(
        (await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: entryId }))?.shoes[0]?.id,
        raceShoe.id
      );
    });

    for (const action of ["delete", "edit"] as const) {
      await check(`${action} plan waits for entry before locking report children`, async () => {
        const date = action === "delete" ? "2026-11-01" : "2026-11-02";
        const removedEntryId = await createEntry(client, 1, date);
        const keptEntryId = action === "edit" ? await createEntry(client, 1, date) : null;
        await saveReport(removedEntryId, { date, weather: "Sunny" });
        const report = await getWorkoutReportByPlanEntry({
          userId: 1,
          planEntryId: removedEntryId,
        });
        assert.ok(report);
        const saver = await connect();
        const planner = await connect();
        const pid = (await planner.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0]
          .pid;
        await saver.query("BEGIN");
        await saver.query("SELECT id FROM plan_entries WHERE id = $1 FOR UPDATE", [removedEntryId]);
        const planning = usingClient(planner, async () => {
          if (action === "delete") {
            return deletePlanEntriesForDate({ userId: 1, date });
          }
          return upsertPlanEntriesForDate({
            userId: 1,
            date,
            originalDate: date,
            isWorkload: false,
            isEdit: true,
            entries: [{ id: keptEntryId, taskText: "Kept run", commentText: null }],
          });
        }).then(
          (result) => ({ result }),
          (error: unknown) => ({ error })
        );
        try {
          await waitForLock(client, pid);
          const conditions = await saver.query(
            "SELECT id FROM workout_report_conditions WHERE workout_report_id = $1 FOR UPDATE NOWAIT",
            [report.id]
          );
          assert.equal(
            conditions.rowCount,
            1,
            "Planner must leave report children unlocked while waiting for the entry"
          );
          await saver.query(
            "UPDATE workout_reports SET result_text = 'Concurrent report edit' WHERE id = $1",
            [report.id]
          );
          await saver.query(
            "UPDATE workout_report_conditions SET weather = 'Rain' WHERE workout_report_id = $1",
            [report.id]
          );
          await saver.query("COMMIT");
          const outcome = await planning;
          assert.ok(
            "result" in outcome,
            "Planner and report writer must complete without a deadlock"
          );
          if (action === "delete") {
            assert.deepEqual(outcome.result, { deleted: true });
          } else {
            assert.ok("entries" in outcome.result);
            assert.equal(outcome.result.entries[0].id, keptEntryId);
          }
        } finally {
          await saver.query("ROLLBACK");
          await planning;
        }
        assert.equal(
          await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: removedEntryId }),
          null
        );
      });
    }
  });
} finally {
  await Promise.allSettled([...clients].map((client) => client.end()));
  if (schemaCreated) {
    assert.match(SCHEMA_NAME, /^shoes_archive_it_\d+_\d+$/);
    await admin.query("SET search_path TO pg_catalog");
    await admin.query(`DROP SCHEMA "${SCHEMA_NAME}" CASCADE`);
    const remaining = await admin.query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [
      SCHEMA_NAME,
    ]);
    assert.equal(remaining.rowCount, 0, "Isolated test schema must be removed");
  }
  await admin.end();
  await db.$client.end();
}

console.log(`PASS ${passed} PostgreSQL integration checks; isolated schema removed`);
