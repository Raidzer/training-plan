import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import ExcelJS from "exceljs";
import { Client } from "pg";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";

assert.equal(
  process.env.RUN_IMPORT_EXPORT_POSTGRES_TESTS,
  "1",
  "Разрешён только явный запуск: RUN_IMPORT_EXPORT_POSTGRES_TESTS=1"
);

const TEST_DATABASE_URL =
  "postgresql://training_test:training_test_password@127.0.0.1:55432/training_plan_concurrency";
const TEST_SCHEMA = `import_export_concurrency_${process.pid}`;
const LOCK_NAMESPACE = 0x54524149;
const admin = new Client({ connectionString: TEST_DATABASE_URL });
const connectionUrl = new URL(TEST_DATABASE_URL);
connectionUrl.searchParams.set("options", `-c search_path=${TEST_SCHEMA}`);
process.env.DATABASE_URL = connectionUrl.toString();

const { db } = await import("@/server/db/client");
const schema = await import("@/server/db/schema");
const { createPlanImport } = await import("@/server/planImports");
const { importDiaryFromWorkbook } = await import("@/server/diaryImports");
const { upsertWeightEntry, getLatestWeightEntry } = await import("@/server/weightEntries");
const { upsertWorkoutReport } = await import("@/server/workoutReports");
const { getDiaryExportRows, getDiaryWeeklyVolumesBySunday } = await import("@/server/diary");
const { getUserProfileById } = await import("@/server/services/users");

function planImport(userId: number, date: string, label = "run", count = 2) {
  return createPlanImport({
    userId,
    filename: `${label}.xlsx`,
    rowCount: count,
    errorsCount: 0,
    entries: Array.from({ length: count }, (_, index) => ({
      userId,
      date,
      sessionOrder: index + 1,
      taskText: `${label} ${index + 1}`,
      commentText: null,
      isWorkload: false,
      rawRow: { date, task: `${label} ${index + 1}`, isWorkload: false },
    })),
  });
}

async function diaryBuffer(date: string, label: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Дневник");
  sheet.addRow([
    "Дата",
    "Задание",
    "Результат",
    "Комментарий",
    "Оценка",
    "Сон",
    "Вес",
    "Объём",
    "утр. пульс",
    "Сон",
    "Вес",
    "Массаж,баня",
    "Объём",
  ]);
  const [year, month, day] = date.split("-");
  sheet.addRow([
    `${day}.${month}.${year}`,
    "10 км",
    `${label} first`,
    "",
    "8-9-7",
    "",
    "",
    "",
    "",
    "08:30",
    "70,1; 69,8",
    "баня",
    "10",
  ]);
  sheet.addRow([
    `${day}.${month}.${year}`,
    "5 км",
    `${label} second`,
    "",
    "8-9-7",
    "",
    "",
    "",
    "",
    "",
    "70,4",
    "массаж",
    "5",
  ]);
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

async function holdLock(userId: number) {
  const blocker = new Client({ connectionString: TEST_DATABASE_URL });
  await blocker.connect();
  await blocker.query("begin");
  await blocker.query("select pg_advisory_xact_lock($1::integer, $2::integer)", [
    LOCK_NAMESPACE,
    userId,
  ]);
  return blocker;
}

async function waitForBlocked(userId: number, count: number) {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    const result = await admin.query<{ count: number }>(
      `select count(*)::integer as count from pg_locks
       where locktype = 'advisory' and classid = $1::oid and objid = $2::oid and not granted`,
      [LOCK_NAMESPACE, userId]
    );
    if (result.rows[0].count >= count) {
      return;
    }
    await delay(10);
  }
  assert.fail(`Не дождались ${count} ожидающих транзакций пользователя ${userId}`);
}

async function concurrently<T>(userId: number, operations: Array<() => Promise<T>>) {
  const blocker = await holdLock(userId);
  const pending = operations.map((operation) => operation());
  const settled = Promise.allSettled(pending);
  try {
    await waitForBlocked(userId, operations.length);
  } finally {
    await blocker.query("rollback");
    await blocker.end();
  }
  const results = await settled;
  return results.map((result) => {
    assert.equal(
      result.status,
      "fulfilled",
      result.status === "rejected" ? String(result.reason) : ""
    );
    return (result as PromiseFulfilledResult<T>).value;
  });
}

async function check(name: string, run: () => Promise<void>) {
  await run();
  console.log(`PASS ${name}`);
}

try {
  await admin.connect();
  await admin.query(`create schema ${TEST_SCHEMA}`);
  await admin.query(`set search_path to ${TEST_SCHEMA}`);
  const empty = generateDrizzleJson({});
  const current = generateDrizzleJson(schema);
  const statements = await generateMigration(empty, current);
  for (const statement of statements) {
    await admin.query(statement.replaceAll('"public".', `"${TEST_SCHEMA}".`));
  }
  for (let userId = 1; userId <= 12; userId += 1) {
    await admin.query(
      "insert into users (id,email,login,password_hash,name) values ($1,$2,$3,'test-only','Before')",
      [userId, `user${userId}@test.invalid`, `user${userId}`]
    );
  }

  await check("concurrent plan imports preserve two sessions without duplicates", async () => {
    const results = await concurrently(1, [
      () => planImport(1, "2026-02-01", "A"),
      () => planImport(1, "2026-02-01", "B"),
    ]);
    assert.deepEqual(results.map((result) => result.insertedCount).sort(), [0, 2]);
    const rows = (
      await admin.query(
        "select session_order,task_text from plan_entries where user_id=1 order by session_order"
      )
    ).rows;
    assert.equal(rows.length, 2);
    assert.deepEqual(
      rows.map((row) => row.session_order),
      [1, 2]
    );
    assert.equal(rows[0].task_text[0], rows[1].task_text[0]);
    assert.equal((await planImport(1, "2026-02-01", "overwrite")).insertedCount, 0);
  });

  await check(
    "concurrent diary imports preserve reports and sequential daily payload",
    async () => {
      const first = await diaryBuffer("2026-02-01", "A");
      const second = await diaryBuffer("2026-02-01", "B");
      const results = await concurrently(1, [
        () => importDiaryFromWorkbook({ userId: 1, buffer: first }),
        () => importDiaryFromWorkbook({ userId: 1, buffer: second }),
      ]);
      assert.deepEqual(results.map((result) => result.reportsUpserted).sort(), [0, 2]);
      assert.deepEqual(results.map((result) => result.reportsSkipped).sort(), [0, 2]);
      const reports = (
        await admin.query("select result_text from workout_reports where user_id=1 order by id")
      ).rows;
      assert.equal(reports.length, 2);
      assert.equal(reports[0].result_text[0], reports[1].result_text[0]);
      assert.deepEqual(
        (
          await admin.query(
            "select period,weight_kg from weight_entries where user_id=1 order by period"
          )
        ).rows,
        [
          { period: "evening", weight_kg: "69.80" },
          { period: "morning", weight_kg: "70.40" },
        ]
      );
      assert.deepEqual(
        (
          await admin.query(
            "select sleep_hours,has_bath,has_mfr,has_massage from recovery_entries where user_id=1"
          )
        ).rows,
        [{ sleep_hours: "8.50", has_bath: false, has_mfr: false, has_massage: true }]
      );
      const before = JSON.stringify(reports);
      const repeated = await importDiaryFromWorkbook({ userId: 1, buffer: second });
      assert.equal(repeated.reportsUpserted, 0);
      assert.equal(
        JSON.stringify(
          (await admin.query("select result_text from workout_reports where user_id=1 order by id"))
            .rows
        ),
        before
      );
    }
  );

  await check(
    "plan error in later batch rolls back import metadata and earlier batch",
    async () => {
      await admin.query(
        "alter table plan_entries add constraint reject_rollback_plan check (task_text <> 'rollback 501')"
      );
      await assert.rejects(planImport(2, "2026-02-02", "rollback", 501));
      assert.equal(
        (await admin.query("select count(*)::int as count from plan_entries where user_id=2"))
          .rows[0].count,
        0
      );
      assert.equal(
        (await admin.query("select count(*)::int as count from plan_imports where user_id=2"))
          .rows[0].count,
        0
      );
      await admin.query("alter table plan_entries drop constraint reject_rollback_plan");
      assert.equal((await planImport(2, "2026-02-02")).insertedCount, 2);
    }
  );

  await check("diary error after report and weight writes rolls back all payload", async () => {
    await planImport(3, "2026-02-03");
    await admin.query(
      "alter table recovery_entries add constraint reject_rollback_diary check (user_id <> 3)"
    );
    await assert.rejects(
      importDiaryFromWorkbook({ userId: 3, buffer: await diaryBuffer("2026-02-03", "rollback") })
    );
    for (const table of ["workout_reports", "weight_entries", "recovery_entries"]) {
      assert.equal(
        (await admin.query(`select count(*)::int as count from ${table} where user_id=3`)).rows[0]
          .count,
        0
      );
    }
    await admin.query("alter table recovery_entries drop constraint reject_rollback_diary");
  });

  await check("another user imports while the first user waits for its lock", async () => {
    const blocker = await holdLock(4);
    const waiting = Promise.allSettled([planImport(4, "2026-02-04")]);
    try {
      await waitForBlocked(4, 1);
      const other = await planImport(5, "2026-02-05");
      assert.equal(other.insertedCount, 2);
      await waitForBlocked(4, 1);
    } finally {
      await blocker.query("rollback");
      await blocker.end();
    }
    assert.equal((await waiting)[0].status, "fulfilled");
  });

  await check(
    "manual weight queued before diary fills the day and is not overwritten",
    async () => {
      await planImport(6, "2026-02-06");
      const blocker = await holdLock(6);
      const manual = upsertWeightEntry({
        userId: 6,
        date: "2026-02-06",
        period: "morning",
        weightKg: 81.2,
      });
      const manualSettled = Promise.allSettled([manual]);
      let diarySettled: Promise<
        PromiseSettledResult<Awaited<ReturnType<typeof importDiaryFromWorkbook>>>[]
      >;
      try {
        await waitForBlocked(6, 1);
        diarySettled = Promise.allSettled([
          importDiaryFromWorkbook({
            userId: 6,
            buffer: await diaryBuffer("2026-02-06", "late import"),
          }),
        ]);
        await waitForBlocked(6, 2);
      } finally {
        await blocker.query("rollback");
        await blocker.end();
      }
      assert.equal((await manualSettled)[0].status, "fulfilled");
      const [result] = await diarySettled!;
      assert.equal(result.status, "fulfilled");
      assert.equal(
        (result as PromiseFulfilledResult<Awaited<ReturnType<typeof importDiaryFromWorkbook>>>)
          .value.reportsUpserted,
        0
      );
      assert.deepEqual(
        (await admin.query("select weight_kg from weight_entries where user_id=6")).rows,
        [{ weight_kg: "81.20" }]
      );
      assert.equal(
        (await admin.query("select count(*)::int as count from workout_reports where user_id=6"))
          .rows[0].count,
        0
      );
    }
  );

  await check(
    "manual report queued after diary sees imported report and updates one record",
    async () => {
      await planImport(7, "2026-02-07");
      const planEntryId = (
        await admin.query(
          "select id from plan_entries where user_id=7 order by session_order limit 1"
        )
      ).rows[0].id as number;
      const blocker = await holdLock(7);
      const importing = importDiaryFromWorkbook({
        userId: 7,
        buffer: await diaryBuffer("2026-02-07", "import"),
      });
      const importingSettled = Promise.allSettled([importing]);
      let manualSettled: Promise<PromiseSettledResult<unknown>[]>;
      try {
        await waitForBlocked(7, 1);
        manualSettled = Promise.allSettled([
          upsertWorkoutReport({
            userId: 7,
            date: "2026-02-07",
            planEntryId,
            startTime: null,
            resultText: "manual",
            distanceKm: 12,
          }),
        ]);
        await waitForBlocked(7, 2);
      } finally {
        await blocker.query("rollback");
        await blocker.end();
      }
      assert.equal((await importingSettled)[0].status, "fulfilled");
      assert.equal((await manualSettled!)[0].status, "fulfilled");
      assert.equal(
        (await admin.query("select count(*)::int as count from workout_reports where user_id=7"))
          .rows[0].count,
        2
      );
      assert.deepEqual(
        (
          await admin.query(
            "select result_text,distance_km from workout_reports where plan_entry_id=$1",
            [planEntryId]
          )
        ).rows,
        [{ result_text: "manual", distance_km: "12.00" }]
      );
    }
  );

  await check("repeatable read keeps rows, weekly totals and profile in one snapshot", async () => {
    await planImport(8, "2026-02-08");
    await importDiaryFromWorkbook({ userId: 8, buffer: await diaryBuffer("2026-02-08", "before") });
    await db.transaction(
      async (tx) => {
        const params = { userId: 8, from: "2026-02-08", to: "2026-02-08" };
        const rows = await getDiaryExportRows(params, tx);
        const profile = await getUserProfileById(8, tx);
        const weight = await getLatestWeightEntry({ userId: 8 }, tx);
        const volumes = await getDiaryWeeklyVolumesBySunday(params, tx);
        assert.equal(volumes.get("2026-02-08"), 15);
        assert.equal(profile?.name, "Before");
        assert.equal(weight, "69.80");
        await admin.query("begin");
        await admin.query(
          "update workout_reports set distance_km=99,result_text='after' where user_id=8"
        );
        await admin.query("update users set name='After' where id=8");
        await admin.query("update weight_entries set weight_kg=88 where user_id=8");
        await admin.query("commit");
        assert.deepEqual(await getDiaryExportRows(params, tx), rows);
        assert.deepEqual(await getDiaryWeeklyVolumesBySunday(params, tx), volumes);
        assert.deepEqual(await getUserProfileById(8, tx), profile);
        assert.equal(await getLatestWeightEntry({ userId: 8 }, tx), weight);
      },
      { isolationLevel: "repeatable read", accessMode: "read only" }
    );
    assert.equal(
      (
        await getDiaryWeeklyVolumesBySunday({ userId: 8, from: "2026-02-08", to: "2026-02-08" })
      ).get("2026-02-08"),
      198
    );
    assert.equal((await getUserProfileById(8))?.name, "After");
    assert.equal(await getLatestWeightEntry({ userId: 8 }), "88.00");
  });
} finally {
  await db.$client.end();
  await admin.query("rollback");
  await admin.query(`drop schema if exists ${TEST_SCHEMA} cascade`);
  await admin.end();
}
