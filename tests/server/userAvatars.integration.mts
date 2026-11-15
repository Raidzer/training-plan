import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile, readdir } from "node:fs/promises";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import sharp from "sharp";
import * as schema from "../../src/server/db/schema";

const CONNECTION = {
  host: "127.0.0.1",
  port: 5432,
  user: "runlog",
  password: "runlog",
  database: "runlog",
  connectionTimeoutMillis: 3000,
};
const SCHEMA_NAME = `avatar_it_${process.pid}_${Date.now()}`;
const context = new AsyncLocalStorage<NodePgDatabase<typeof schema>>();
const admin = new Client(CONNECTION);
const worker = new Client(CONNECTION);
const secondWorker = new Client(CONNECTION);
let schemaCreated = false;
let passed = 0;

const { db } = await import("../../src/server/db/client");
const avatars = await import("../../src/server/services/userAvatars");
const { deleteUserAccountById } = await import("../../src/server/adminUsers");
const { processProfileAvatar } = await import("../../src/server/profileAvatar");

for (const method of ["select", "insert", "delete", "transaction"] as const) {
  Object.defineProperty(db, method, {
    configurable: true,
    value: (...args: unknown[]) => {
      const database = context.getStore();
      assert.ok(database, "Queries must use the isolated integration connection");
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

try {
  assert.match(SCHEMA_NAME, /^avatar_it_\d+_\d+$/);
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${SCHEMA_NAME}"`);
  schemaCreated = true;
  await admin.query(`SET search_path TO "${SCHEMA_NAME}"`);
  const migrationDirectory = new URL("../../drizzle/", import.meta.url);
  for (const name of (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const source = await readFile(new URL(name, migrationDirectory), "utf8");
    await admin.query(source.replaceAll('"public".', `"${SCHEMA_NAME}".`));
  }
  await admin.query(
    "INSERT INTO users (id, email, login, password_hash, name) VALUES (1, 'owner@example.test', 'owner', 'fixture', 'Owner'), (2, 'other@example.test', 'other', 'fixture', 'Other'), (3, 'race@example.test', 'race', 'fixture', 'Race')"
  );
  for (const client of [worker, secondWorker]) {
    await client.connect();
    await client.query(`SET search_path TO "${SCHEMA_NAME}"`);
    await client.query("SET statement_timeout TO '8s'");
    await client.query("SET lock_timeout TO '5s'");
  }
  const image = await processProfileAvatar(
    await sharp({ create: { width: 512, height: 512, channels: 3, background: "#345678" } })
      .png()
      .toBuffer()
  );

  await check("migrations and binary round trip with owner isolation", async () => {
    assert.equal(await run(() => avatars.getUserAvatarVersionById(1)), null);
    const version = await run(() => avatars.saveUserAvatar(1, image));
    const avatar = await run(() => avatars.getUserAvatarById(1));
    assert.ok(avatar);
    assert.ok(Buffer.isBuffer(avatar.data));
    assert.deepEqual(avatar.data, image);
    assert.equal(avatar.version, version);
    assert.equal(await run(() => avatars.getUserAvatarVersionById(1)), version);
    assert.equal(await run(() => avatars.getUserAvatarById(2)), null);
  });

  await check("replacement keeps exactly one current avatar", async () => {
    const previous = await run(() => avatars.getUserAvatarVersionById(1));
    const current = await run(() => avatars.saveUserAvatar(1, image));
    assert.notEqual(current, previous);
    assert.equal(await run(() => avatars.getUserAvatarVersionById(1)), current);
    assert.equal(
      (await admin.query("SELECT count(*)::int AS count FROM user_avatars WHERE user_id = 1"))
        .rows[0].count,
      1
    );
  });

  await check("concurrent saves remain one complete avatar", async () => {
    const versions = await Promise.all([
      run(() => avatars.saveUserAvatar(1, image)),
      run(() => avatars.saveUserAvatar(1, image), secondWorker),
    ]);
    const avatar = await run(() => avatars.getUserAvatarById(1));
    assert.ok(avatar);
    assert.ok(versions.includes(avatar.version));
    assert.deepEqual(avatar.data, image);
    assert.equal(
      (await admin.query("SELECT count(*)::int AS count FROM user_avatars WHERE user_id = 1"))
        .rows[0].count,
      1
    );
  });

  await check("idempotent delete leaves other users untouched", async () => {
    await run(() => avatars.saveUserAvatar(2, image));
    await run(() => avatars.deleteUserAvatarById(1));
    await run(() => avatars.deleteUserAvatarById(1));
    assert.equal(await run(() => avatars.getUserAvatarById(1)), null);
    assert.ok(await run(() => avatars.getUserAvatarById(2)));
  });

  await check("account deletion cascades through the real account service", async () => {
    await run(() => avatars.saveUserAvatar(1, image));
    assert.deepEqual(await run(() => deleteUserAccountById(1)), { deleted: true });
    assert.equal(await run(() => avatars.getUserAvatarById(1)), null);
    assert.ok(await run(() => avatars.getUserAvatarById(2)));
  });

  await check("save racing account deletion cannot create an orphan", async () => {
    await admin.query("BEGIN");
    await admin.query("DELETE FROM users WHERE id = 3");
    const pending = run(() => avatars.saveUserAvatar(3, image)).then(
      () => ({ rejected: false, code: undefined }),
      (error: { code?: string; cause?: { code?: string } }) => ({
        rejected: true,
        code: error.code ?? error.cause?.code,
      })
    );
    await admin.query("COMMIT");
    assert.deepEqual(await pending, { rejected: true, code: "23503" });
    assert.equal(await run(() => avatars.getUserAvatarById(3)), null);
  });
  console.log(`${passed} PostgreSQL avatar integration checks passed`);
} finally {
  await admin.query("ROLLBACK").catch(() => {});
  await worker.end().catch(() => {});
  await secondWorker.end().catch(() => {});
  if (schemaCreated) {
    await admin.query(`DROP SCHEMA "${SCHEMA_NAME}" CASCADE`);
  }
  await admin.end().catch(() => {});
}
