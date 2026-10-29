import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile, readdir } from "node:fs/promises";
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
const SCHEMA_NAME = `competition_results_it_${process.pid}_${Date.now()}`;
const context = new AsyncLocalStorage<NodePgDatabase<typeof schema>>();
const admin = new Client(CONNECTION);
const worker = new Client(CONNECTION);
const secondWorker = new Client(CONNECTION);
let schemaCreated = false;
let passed = 0;

const { db } = await import("../../src/server/db/client");
const service = await import("../../src/server/competitionResultRequests");
const { updateCompetition } = await import("../../src/server/competitions");

for (const method of ["select", "insert", "update", "transaction"] as const) {
  Object.defineProperty(db, method, {
    configurable: true,
    value: (...args: unknown[]) => {
      const database = context.getStore();
      assert.ok(database, "Production queries must use the isolated test connection");
      return Reflect.apply(database[method], database, args);
    },
  });
}

function run<T>(callback: () => Promise<T>, client = worker) {
  return context.run(drizzle(client, { schema }), callback);
}

async function check(name: string, callback: () => Promise<void>) {
  await callback();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function newCompetition(date = "2026-10-28", distanceLabel = "10 км") {
  const result = await admin.query<{ id: number }>(
    "INSERT INTO competitions (block_id, date, name_location, distance_meters, distance_label) VALUES (1, $1, 'Осенний старт', 10000, $2) RETURNING id",
    [date, distanceLabel]
  );
  return result.rows[0].id;
}

async function sendRequest(competitionId: number, date = "2026-10-28") {
  const claim = await run(() =>
    service.claimCompetitionResultRequest({
      userId: 1,
      chatId: 100,
      competitionId,
      date,
    })
  );
  assert.ok(claim);
  assert.equal(
    await run(() =>
      service.markCompetitionResultRequestSent({
        requestId: claim.id,
        leaseToken: claim.leaseToken,
      })
    ),
    true
  );
  return { requestId: claim.id, chatId: 100 };
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
  assert.fail("Concurrent action did not reach the source row lock");
}

try {
  assert.match(SCHEMA_NAME, /^competition_results_it_\d+_\d+$/);
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${SCHEMA_NAME}"`);
  schemaCreated = true;
  await admin.query(`SET search_path TO "${SCHEMA_NAME}"`);
  const migrationDirectory = new URL("../../drizzle/", import.meta.url);
  const migrationNames = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const name of migrationNames) {
    const source = await readFile(new URL(name, migrationDirectory), "utf8");
    await admin.query(source.replaceAll('"public".', `"${SCHEMA_NAME}".`));
  }
  await admin.query(
    "INSERT INTO users (id, email, login, password_hash, name) VALUES (1, 'owner@example.test', 'owner', 'fixture', 'Owner'), (2, 'other@example.test', 'other', 'fixture', 'Other')"
  );
  await admin.query(
    "INSERT INTO competition_blocks (id, user_id, title, start_date, end_date) VALUES (1, 1, 'Осень', '2026-10-01', '2026-11-01'), (2, 2, 'Чужой', '2026-10-01', '2026-11-01')"
  );
  await admin.query("INSERT INTO telegram_accounts (user_id, chat_id) VALUES (1, 100), (2, 200)");
  await admin.query(
    "INSERT INTO telegram_subscriptions (user_id, chat_id, enabled, send_time) VALUES (1, 100, true, '09:00')"
  );
  for (const client of [worker, secondWorker]) {
    await client.connect();
    await client.query(`SET search_path TO "${SCHEMA_NAME}"`);
    await client.query("SET statement_timeout TO '8s'");
    await client.query("SET lock_timeout TO '5s'");
  }
  const backendPid = (await worker.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0]
    .pid;
  const firstCompetitionId = await newCompetition();
  const secondCompetitionId = await newCompetition();

  await check("due query scopes date, subscription, owner, result and skip", async () => {
    const filledId = await newCompetition();
    const skippedId = await newCompetition();
    await newCompetition("2026-10-27");
    await admin.query("UPDATE competitions SET result = '39:30' WHERE id = $1", [filledId]);
    await admin.query("UPDATE competitions SET is_skipped = true WHERE id = $1", [skippedId]);
    const due = await run(() =>
      service.listDueCompetitions({ userId: 1, chatId: 100, date: "2026-10-28" })
    );
    assert.deepEqual(
      due.map((item) => item.id),
      [firstCompetitionId, secondCompetitionId]
    );
    assert.deepEqual(
      await run(() => service.listDueCompetitions({ userId: 2, chatId: 100, date: "2026-10-28" })),
      []
    );
    await admin.query("UPDATE telegram_subscriptions SET enabled = false WHERE user_id = 1");
    assert.deepEqual(
      await run(() => service.listDueCompetitions({ userId: 1, chatId: 100, date: "2026-10-28" })),
      []
    );
    await admin.query("UPDATE telegram_subscriptions SET enabled = true WHERE user_id = 1");
  });

  await check("parallel send claims produce one lease and failures can retry", async () => {
    const params = {
      userId: 1,
      chatId: 100,
      competitionId: firstCompetitionId,
      date: "2026-10-28",
    };
    const claims = await Promise.all([
      run(() => service.claimCompetitionResultRequest(params)),
      run(() => service.claimCompetitionResultRequest(params), secondWorker),
    ]);
    assert.equal(claims.filter(Boolean).length, 1);
    const claim = claims.find((item) => item !== null)!;
    assert.equal(
      await run(() =>
        service.markCompetitionResultRequestSent({ requestId: claim.id, leaseToken: "wrong" })
      ),
      false
    );
    await run(() =>
      service.releaseCompetitionResultRequestClaim({
        requestId: claim.id,
        leaseToken: claim.leaseToken,
      })
    );
    assert.ok(await run(() => service.claimCompetitionResultRequest(params)));
    await admin.query(
      "UPDATE competition_result_requests SET lease_expires_at = now() - interval '1 minute' WHERE id = $1",
      [claim.id]
    );
    const retry = await run(() => service.claimCompetitionResultRequest(params));
    assert.ok(retry);
    assert.equal(
      await run(() =>
        service.markCompetitionResultRequestSent({
          requestId: retry.id,
          leaseToken: retry.leaseToken,
        })
      ),
      true
    );
    assert.equal(await run(() => service.claimCompetitionResultRequest(params)), null);
  });

  const params = await sendRequest(secondCompetitionId);
  await check("ForceReply survives lookup and foreign chats cannot use it", async () => {
    assert.equal(
      await run(() => service.setCompetitionResultPrompt({ ...params, promptMessageId: 50 })),
      true
    );
    assert.equal(
      (
        await run(() =>
          service.findCompetitionResultRequestByPrompt({ chatId: 100, promptMessageId: 50 })
        )
      )?.request?.id,
      params.requestId
    );
    assert.equal(
      await run(() => service.getCompetitionResultRequest({ ...params, chatId: 200 })),
      null
    );
    assert.equal(
      await run(() =>
        service.findCompetitionResultRequestByPrompt({ chatId: 200, promptMessageId: 50 })
      ),
      null
    );
    await admin.query("UPDATE users SET is_active = false WHERE id = 1");
    assert.equal(await run(() => service.getCompetitionResultRequest(params)), null);
    await admin.query("UPDATE users SET is_active = true WHERE id = 1");
  });

  await check("simultaneous save and skip cannot overwrite each other", async () => {
    const results = await Promise.all([
      run(() => service.saveCompetitionResult({ ...params, result: "39:30,1" })),
      run(() => service.skipCompetitionResult(params), secondWorker),
    ]);
    assert.equal(results.filter(Boolean).length, 1);
    const row = (
      await admin.query("SELECT result, is_skipped FROM competitions WHERE id = $1", [
        secondCompetitionId,
      ])
    ).rows[0];
    assert.equal(Boolean(row.result), !row.is_skipped);
    assert.equal(
      await run(() => service.saveCompetitionResult({ ...params, result: "38:00" })),
      null
    );
  });

  await check("web result clears skip, later stale bot actions cannot replace it", async () => {
    await admin.query("UPDATE competitions SET result = NULL, is_skipped = true WHERE id = $1", [
      secondCompetitionId,
    ]);
    const saved = await run(() =>
      updateCompetition({ userId: 1, competitionId: secondCompetitionId, result: "38:00" })
    );
    assert.equal(saved?.isSkipped, false);
    assert.equal(await run(() => service.skipCompetitionResult(params)), null);
    assert.equal(
      await run(() => service.saveCompetitionResult({ ...params, result: "37:00" })),
      null
    );
  });

  await check("moving competition invalidates old prompt and allows new date request", async () => {
    const id = await newCompetition();
    const original = await sendRequest(id);
    await run(() => service.setCompetitionResultPrompt({ ...original, promptMessageId: 51 }));
    await admin.query("UPDATE competitions SET date = '2026-10-29' WHERE id = $1", [id]);
    assert.equal(await run(() => service.getCompetitionResultRequest(original)), null);
    assert.deepEqual(
      await run(() =>
        service.findCompetitionResultRequestByPrompt({ chatId: 100, promptMessageId: 51 })
      ),
      { id: original.requestId, request: null }
    );
    assert.ok(await sendRequest(id, "2026-10-29"));
  });

  await check("old 10km prompt cannot save after changing the competition distance", async () => {
    const id = await newCompetition();
    const original = await sendRequest(id);
    assert.equal(
      await run(() => service.setCompetitionResultPrompt({ ...original, promptMessageId: 52 })),
      true
    );
    await run(() =>
      updateCompetition({
        userId: 1,
        competitionId: id,
        distanceLabel: "5 км",
        distanceMeters: 5000,
      })
    );
    assert.equal(
      await run(() => service.saveCompetitionResult({ ...original, result: "39:30" })),
      null
    );
    assert.equal(await run(() => service.skipCompetitionResult(original)), null);
    assert.equal(
      (await admin.query("SELECT result FROM competitions WHERE id = $1", [id])).rows[0].result,
      null
    );
  });

  await check("filling and clearing result on website never revives an old prompt", async () => {
    const id = await newCompetition();
    const original = await sendRequest(id);
    await run(() => service.setCompetitionResultPrompt({ ...original, promptMessageId: 53 }));
    await run(() => updateCompetition({ userId: 1, competitionId: id, result: "40:00" }));
    await run(() => updateCompetition({ userId: 1, competitionId: id, result: null }));
    assert.equal(await run(() => service.skipCompetitionResult(original)), null);
    assert.equal(
      await run(() => service.saveCompetitionResult({ ...original, result: "39:30" })),
      null
    );
    assert.equal(await run(() => service.getCompetitionResultRequest(original)), null);
  });

  await check("pending snapshot cannot confirm a record before saving a result", async () => {
    const id = await newCompetition();
    const original = await sendRequest(id);
    assert.equal(await run(() => service.confirmCompetitionResultRecord(original)), "stale");
  });

  const recordCompetitionId = await newCompetition();
  const recordParams = await sendRequest(recordCompetitionId);
  await check("result remains saved independently of record confirmation", async () => {
    await assert.rejects(
      run(() => service.saveCompetitionResult({ ...recordParams, result: "00:00" })),
      /invalid_time/
    );
    const saved = await run(() =>
      service.saveCompetitionResult({ ...recordParams, result: "39:30,1" })
    );
    assert.equal(saved?.savedResult, "00:39:30.10");
    assert.equal(
      (await admin.query("SELECT count(*) AS count FROM personal_records")).rows[0].count,
      "0"
    );
  });

  await check("confirmation writes first record and repeat does not overwrite it", async () => {
    assert.equal(await run(() => service.confirmCompetitionResultRecord(recordParams)), "updated");
    assert.equal(
      await run(() => service.confirmCompetitionResultRecord(recordParams)),
      "not_better"
    );
    const record = (
      await admin.query(
        "SELECT time_text, race_name, race_city, protocol_url FROM personal_records WHERE user_id = 1"
      )
    ).rows[0];
    assert.deepEqual(record, {
      time_text: "00:39:30.10",
      race_name: "Осенний старт",
      race_city: null,
      protocol_url: null,
    });
  });

  await check("faster and invalid current records stay intact", async () => {
    await admin.query("UPDATE personal_records SET time_text = '38:00' WHERE user_id = 1");
    assert.equal(
      await run(() => service.confirmCompetitionResultRecord(recordParams)),
      "not_better"
    );
    await admin.query("UPDATE personal_records SET time_text = 'DNF' WHERE user_id = 1");
    assert.equal(
      await run(() => service.confirmCompetitionResultRecord(recordParams)),
      "invalid_current_record"
    );
    await admin.query("UPDATE personal_records SET time_text = '40:00' WHERE user_id = 1");
  });

  await check("record SQL failure rolls back record only and permits retry", async () => {
    await admin.query(
      "ALTER TABLE personal_records ADD CONSTRAINT reject_result_test CHECK (time_text <> '00:39:30.10')"
    );
    await assert.rejects(run(() => service.confirmCompetitionResultRecord(recordParams)));
    const result = await run(() => service.getCompetitionResultRequest(recordParams));
    assert.equal(result?.competition.result, "00:39:30.10");
    await admin.query("ALTER TABLE personal_records DROP CONSTRAINT reject_result_test");
    assert.equal(await run(() => service.confirmCompetitionResultRecord(recordParams)), "updated");
  });

  await check("concurrent source edit is observed before confirming record", async () => {
    await admin.query("UPDATE personal_records SET time_text = '40:00' WHERE user_id = 1");
    await admin.query("BEGIN");
    let pending: ReturnType<typeof service.confirmCompetitionResultRecord> | undefined;
    try {
      await admin.query(
        "UPDATE competitions SET name_location = 'Изменённый старт' WHERE id = $1",
        [recordCompetitionId]
      );
      pending = run(() => service.confirmCompetitionResultRecord(recordParams));
      await waitForLock(backendPid);
      await admin.query("COMMIT");
      assert.equal(await pending, "stale");
    } finally {
      await admin.query("ROLLBACK");
      await pending;
    }
    assert.equal(
      (await admin.query("SELECT time_text FROM personal_records WHERE user_id = 1")).rows[0]
        .time_text,
      "40:00"
    );
  });

  await check("relinking the same chat invalidates old account identity", async () => {
    await admin.query("DELETE FROM telegram_accounts WHERE user_id = 1");
    await admin.query("INSERT INTO telegram_accounts (user_id, chat_id) VALUES (1, 100)");
    assert.equal(await run(() => service.getCompetitionResultRequest(params)), null);
    assert.equal(await run(() => service.skipCompetitionResult(params)), null);
  });
} finally {
  await worker.end();
  await secondWorker.end();
  if (schemaCreated) {
    assert.match(SCHEMA_NAME, /^competition_results_it_\d+_\d+$/);
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

console.log(`PASS ${passed} PostgreSQL integration checks; isolated schema removed`);
