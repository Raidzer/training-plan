import "dotenv/config";
import { Client } from "pg";

const parseNumber = (value) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getClientConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) return { connectionString };

  const host = process.env.PGHOST ?? process.env.POSTGRES_HOST;
  const port = parseNumber(process.env.PGPORT ?? process.env.POSTGRES_PORT);
  const user = process.env.PGUSER ?? process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE ?? process.env.POSTGRES_DB;

  if (!host || !user || !password || !database) return null;
  return { host, port, user, password, database };
};

const clientConfig = getClientConfig();
if (!clientConfig) {
  console.error(
    "Database config is not set (expected DATABASE_URL or PG*/POSTGRES_* variables)"
  );
  process.exit(1);
}

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60_000);
const retryDelayMs = Number(process.env.DB_WAIT_RETRY_MS ?? 2_000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const start = Date.now();
let attempt = 1;

while (true) {
  const elapsed = Date.now() - start;
  const remaining = timeoutMs - elapsed;

  if (remaining <= 0) {
    console.error("Timed out waiting for Postgres to accept connections");
    process.exit(1);
  }

  const client = new Client(clientConfig);

  try {
    await client.connect();
    await client.query("SELECT 1");
    console.log("Database is ready");
    await client.end();
    break;
  } catch (error) {
    console.log(
      `Waiting for database (attempt ${attempt}, ${Math.max(remaining, 0)}ms left)${
        error?.message ? `: ${error.message}` : ""
      }`
    );
    await client.end().catch(() => {});
    await sleep(Math.min(retryDelayMs, remaining));
    attempt += 1;
  }
}
