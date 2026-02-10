import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { planEntries, planImports } from "@/server/db/schema";

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
  dates: string[]
): Promise<Set<string>> {
  if (dates.length === 0) {
    return new Set();
  }

  const existingRows = await db
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
  newEntries: PlanImportEntry[];
  errorsCount: number;
}) {
  const now = new Date();

  return await db.transaction(async (tx) => {
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

    if (params.newEntries.length > 0) {
      await tx.insert(planEntries).values(
        params.newEntries.map((entry) => ({
          ...entry,
          importId: importRow.id,
        }))
      );
    }

    const skippedCount =
      params.errorsCount + Math.max(0, params.entries.length - params.newEntries.length);
    await tx
      .update(planImports)
      .set({
        insertedCount: params.newEntries.length,
        skippedCount,
        completedAt: now,
      })
      .where(eq(planImports.id, importRow.id));

    return { id: importRow.id, insertedCount: params.newEntries.length };
  });
}
