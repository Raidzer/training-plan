import "dotenv/config";

const parseNumber = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getDbCredentials = () => {
  const url = process.env.DATABASE_URL;
  if (url) return { url } as const;

  const host = process.env.PGHOST ?? process.env.POSTGRES_HOST ?? "localhost";
  const port = parseNumber(process.env.PGPORT ?? process.env.POSTGRES_PORT);
  const user = process.env.PGUSER ?? process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE ?? process.env.POSTGRES_DB;

  return { host, port, user, password, database } as const;
};
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: getDbCredentials(),
} as const;
