import { sql } from "drizzle-orm";
import type { db } from "@/server/db/client";

type TrainingDataTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const TRAINING_DATA_LOCK_NAMESPACE = 0x54524149;

export async function lockTrainingData(tx: TrainingDataTransaction, userId: number) {
  await tx.execute(sql`select set_config('lock_timeout', '5s', true)`);
  await tx.execute(
    sql`select pg_advisory_xact_lock(${TRAINING_DATA_LOCK_NAMESPACE}::integer, ${userId}::integer)`
  );
}

export function isTrainingDataBusyError(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current = error;
  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    if ("code" in current && current.code === "55P03") {
      return true;
    }
    if (
      current instanceof Error &&
      (current.message === "timeout exceeded when trying to connect" ||
        current.message === "Connection terminated due to connection timeout")
    ) {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}
