import "dotenv/config";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in .env");
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

  const client = new Client({ connectionString });

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
