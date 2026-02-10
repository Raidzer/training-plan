import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  planEntries,
  workoutReportConditions,
  workoutReportShoes,
  workoutReports,
} from "@/server/db/schema";

export type PlanEntryWithReport = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  importId: number | null;
  isWorkload: boolean;
  hasReport: boolean;
};

export type PlanEntryInput = {
  id: number | null;
  taskText: string;
  commentText: string | null;
};

export type PlanEntriesUpdateResult =
  | { entries: PlanEntryWithReport[] }
  | { error: "date_exists" | "not_found" | "invalid_entry_id" };

export async function getPlanEntriesWithReportFlags(
  userId: number,
  limit: number
): Promise<PlanEntryWithReport[]> {
  return await db
    .select({
      id: planEntries.id,
      date: planEntries.date,
      sessionOrder: planEntries.sessionOrder,
      taskText: planEntries.taskText,
      commentText: planEntries.commentText,
      importId: planEntries.importId,
      isWorkload: planEntries.isWorkload,
      hasReport: sql<boolean>`(${workoutReports.id} is not null)`.as("hasReport"),
    })
    .from(planEntries)
    .leftJoin(workoutReports, eq(workoutReports.planEntryId, planEntries.id))
    .where(eq(planEntries.userId, userId))
    .orderBy(desc(planEntries.date), asc(planEntries.sessionOrder))
    .limit(limit);
}

export async function upsertPlanEntriesForDate(params: {
  userId: number;
  date: string;
  originalDate: string;
  isWorkload: boolean;
  entries: PlanEntryInput[];
  isEdit: boolean;
}): Promise<PlanEntriesUpdateResult> {
  const { userId, date, originalDate, isWorkload, entries, isEdit } = params;

  const updated = await db.transaction(async (tx) => {
    const datesToCheck = date === originalDate ? [date] : [date, originalDate];
    const dateRows = await tx
      .select({ id: planEntries.id, date: planEntries.date })
      .from(planEntries)
      .where(and(eq(planEntries.userId, userId), inArray(planEntries.date, datesToCheck)));

    const hasOriginal = dateRows.some((row) => row.date === originalDate);
    const hasDate = dateRows.some((row) => row.date === date);

    if (isEdit) {
      if (!hasOriginal) {
        return { error: "not_found" as const };
      }
      if (date !== originalDate && hasDate) {
        return { error: "date_exists" as const };
      }
    } else if (hasDate) {
      return { error: "date_exists" as const };
    }

    if (!isEdit) {
      for (const entry of entries) {
        if (entry.id) {
          return { error: "invalid_entry_id" as const };
        }
      }
    }

    const existingRows = isEdit
      ? await tx
          .select({ id: planEntries.id })
          .from(planEntries)
          .where(and(eq(planEntries.userId, userId), eq(planEntries.date, originalDate)))
      : [];

    const existingIds = new Set(existingRows.map((row) => row.id));
    if (isEdit) {
      for (const entry of entries) {
        if (entry.id && !existingIds.has(entry.id)) {
          return { error: "invalid_entry_id" as const };
        }
      }
    }

    const keepIds = new Set<number>();
    if (isEdit) {
      for (const entry of entries) {
        if (entry.id) {
          keepIds.add(entry.id);
        }
      }
    }

    const removedIds = isEdit
      ? existingRows.filter((row) => !keepIds.has(row.id)).map((row) => row.id)
      : [];

    if (removedIds.length > 0) {
      const removedReportIds = await tx
        .select({ id: workoutReports.id })
        .from(workoutReports)
        .where(
          and(eq(workoutReports.userId, userId), inArray(workoutReports.planEntryId, removedIds))
        );

      const reportIds = removedReportIds.map((row) => row.id);
      if (reportIds.length > 0) {
        await tx
          .delete(workoutReportConditions)
          .where(inArray(workoutReportConditions.workoutReportId, reportIds));
        await tx
          .delete(workoutReportShoes)
          .where(inArray(workoutReportShoes.workoutReportId, reportIds));
        await tx.delete(workoutReports).where(inArray(workoutReports.id, reportIds));
      }

      await tx
        .delete(planEntries)
        .where(and(eq(planEntries.userId, userId), inArray(planEntries.id, removedIds)));
    }

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const sessionOrder = index + 1;
      if (entry.id) {
        await tx
          .update(planEntries)
          .set({
            date,
            sessionOrder,
            taskText: entry.taskText,
            commentText: entry.commentText ?? null,
            isWorkload,
          })
          .where(and(eq(planEntries.userId, userId), eq(planEntries.id, entry.id)));
      } else {
        await tx.insert(planEntries).values({
          userId,
          date,
          sessionOrder,
          taskText: entry.taskText,
          commentText: entry.commentText ?? null,
          isWorkload,
          importId: null,
        });
      }
    }

    if (isEdit && date !== originalDate && keepIds.size > 0) {
      await tx
        .update(workoutReports)
        .set({ date })
        .where(
          and(
            eq(workoutReports.userId, userId),
            inArray(workoutReports.planEntryId, Array.from(keepIds))
          )
        );
    }

    const updatedEntries = await tx
      .select({
        id: planEntries.id,
        date: planEntries.date,
        sessionOrder: planEntries.sessionOrder,
        taskText: planEntries.taskText,
        commentText: planEntries.commentText,
        importId: planEntries.importId,
        isWorkload: planEntries.isWorkload,
        hasReport: sql<boolean>`(${workoutReports.id} is not null)`.as("hasReport"),
      })
      .from(planEntries)
      .leftJoin(workoutReports, eq(workoutReports.planEntryId, planEntries.id))
      .where(and(eq(planEntries.userId, userId), eq(planEntries.date, date)))
      .orderBy(asc(planEntries.sessionOrder));

    return { entries: updatedEntries };
  });

  return updated;
}

export async function deletePlanEntriesForDate(params: {
  userId: number;
  date: string;
}): Promise<{ deleted: true } | { error: "not_found" }> {
  const deleted = await db.transaction(async (tx) => {
    const dayEntries = await tx
      .select({ id: planEntries.id })
      .from(planEntries)
      .where(and(eq(planEntries.userId, params.userId), eq(planEntries.date, params.date)));

    if (dayEntries.length === 0) {
      return { error: "not_found" as const };
    }

    const entryIds = dayEntries.map((entry) => entry.id);
    const reportIds = await tx
      .select({ id: workoutReports.id })
      .from(workoutReports)
      .where(
        and(eq(workoutReports.userId, params.userId), inArray(workoutReports.planEntryId, entryIds))
      );

    const reportIdList = reportIds.map((row) => row.id);
    if (reportIdList.length > 0) {
      await tx
        .delete(workoutReportConditions)
        .where(inArray(workoutReportConditions.workoutReportId, reportIdList));
      await tx
        .delete(workoutReportShoes)
        .where(inArray(workoutReportShoes.workoutReportId, reportIdList));
      await tx.delete(workoutReports).where(inArray(workoutReports.id, reportIdList));
    }

    await tx
      .delete(planEntries)
      .where(and(eq(planEntries.userId, params.userId), eq(planEntries.date, params.date)));

    return { deleted: true as const };
  });

  return deleted;
}
