import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { planEntries, planImports } from "@/server/db/schema";
import { lockTrainingData } from "@/server/trainingDataLock";
import { IMPORT_BATCH_SIZE } from "@/server/spreadsheetLimits";

export type PlanImportEntry = {
  userId: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  rawRow: { date: string; task: string; comment?: string; isWorkload: boolean };
};

export async function getExistingPlanEntryDates(
  userId: number,
  dates: string[],
  database: Pick<typeof db, "select"> = db
): Promise<Set<string>> {
  if (dates.length === 0) {
    return new Set();
  }

  const existingRows = await database
    .select({ date: planEntries.date })
    .from(planEntries)
    .where(and(eq(planEntries.userId, userId), inArray(planEntries.date, dates)));

  return new Set(existingRows.map((row) => row.date));
}

export async function getLatestPlanEntryDate(userId: number): Promise<string | null> {
  const [lastRow] = await db
    .select({ date: planEntries.date })
    .from(planEntries)
    .where(eq(planEntries.userId, userId))
    .orderBy(desc(planEntries.date))
    .limit(1);

  if (!lastRow?.date) {
    return null;
  }

  return lastRow.date;
}

export async function createPlanImport(params: {
  userId: number;
  filename: string;
  rowCount: number;
  entries: PlanImportEntry[];
  errorsCount: number;
}) {
  const now = new Date();

  return await db.transaction(async (tx) => {
    await lockTrainingData(tx, params.userId);
    const dates = Array.from(new Set(params.entries.map((entry) => entry.date)));
    const existingDates = await getExistingPlanEntryDates(params.userId, dates, tx);
    const newEntries = params.entries.filter((entry) => !existingDates.has(entry.date));
    const [importRow] = await tx
      .insert(planImports)
      .values({
        userId: params.userId,
        filename: params.filename,
        rowCount: params.rowCount,
        insertedCount: params.entries.length,
        skippedCount: params.errorsCount,
      })
      .returning({ id: planImports.id });

    let insertedCount = 0;
    for (let offset = 0; offset < newEntries.length; offset += IMPORT_BATCH_SIZE) {
      const insertedRows = await tx
        .insert(planEntries)
        .values(
          newEntries.slice(offset, offset + IMPORT_BATCH_SIZE).map((entry) => ({
            ...entry,
            importId: importRow.id,
          }))
        )
        .returning({ id: planEntries.id });
      insertedCount += insertedRows.length;
    }

    const skippedCount = params.errorsCount + Math.max(0, params.entries.length - insertedCount);
    await tx
      .update(planImports)
      .set({
        insertedCount,
        skippedCount,
        completedAt: now,
      })
      .where(eq(planImports.id, importRow.id));

    return { id: importRow.id, insertedCount };
  });
}
