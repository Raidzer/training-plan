import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const parseNumber = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getPoolConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return { connectionString } as const;
  }

  const host = process.env.PGHOST ?? process.env.POSTGRES_HOST;
  const port = parseNumber(process.env.PGPORT ?? process.env.POSTGRES_PORT);
  const user = process.env.PGUSER ?? process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE ?? process.env.POSTGRES_DB;

  return { host, port, user, password, database } as const;
};

const pool = new Pool(getPoolConfig());
export const db = drizzle(pool);
