import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { planEntries, workoutReportConditions, workoutReports } from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = Number((session.user as any)?.id);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const entries = await db
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
    .limit(500);

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = Number((session.user as any)?.id);
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        originalDate?: string;
        date?: string;
        isWorkload?: boolean;
        entries?: {
          id?: number;
          taskText?: string;
          commentText?: string | null;
        }[];
      }
    | null;

  const date = typeof body?.date === "string" ? body.date.trim() : "";
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const originalDateRaw =
    typeof body?.originalDate === "string" ? body.originalDate.trim() : "";
  const hasOriginalDate = originalDateRaw.length > 0;
  const originalDate = hasOriginalDate ? originalDateRaw : date;
  if (hasOriginalDate && !dateRegex.test(originalDate)) {
    return NextResponse.json({ error: "invalid_original_date" }, { status: 400 });
  }

  const incomingEntries = Array.isArray(body?.entries) ? body!.entries! : [];
  if (incomingEntries.length === 0) {
    return NextResponse.json({ error: "empty_entries" }, { status: 400 });
  }

  const normalized: {
    id: number | null;
    taskText: string;
    commentText: string | null;
  }[] = [];
  const seenIds = new Set<number>();
  for (const entry of incomingEntries) {
    let id: number | null = null;
    if (entry?.id !== undefined && entry?.id !== null) {
      const numericId = Number(entry.id);
      if (!Number.isInteger(numericId) || numericId <= 0 || seenIds.has(numericId)) {
        return NextResponse.json({ error: "invalid_entry_id" }, { status: 400 });
      }
      seenIds.add(numericId);
      id = numericId;
    }

    const taskText = typeof entry?.taskText === "string" ? entry.taskText.trim() : "";
    if (!taskText) {
      return NextResponse.json({ error: "empty_entries" }, { status: 400 });
    }

    const commentTextRaw =
      typeof entry?.commentText === "string"
        ? entry.commentText.trim()
        : entry?.commentText === null
        ? null
        : "";
    const commentText = commentTextRaw ? commentTextRaw : null;

    normalized.push({ id, taskText, commentText });
  }

  const isWorkload = Boolean(body?.isWorkload);
  const isEdit = hasOriginalDate;

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
      for (const entry of normalized) {
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
      for (const entry of normalized) {
        if (entry.id && !existingIds.has(entry.id)) {
          return { error: "invalid_entry_id" as const };
        }
      }
    }

    const keepIds = new Set<number>();
    if (isEdit) {
      for (const entry of normalized) {
        if (entry.id) keepIds.add(entry.id);
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
          and(
            eq(workoutReports.userId, userId),
            inArray(workoutReports.planEntryId, removedIds)
          )
        );

      const reportIds = removedReportIds.map((row) => row.id);
      if (reportIds.length > 0) {
        await tx
          .delete(workoutReportConditions)
          .where(inArray(workoutReportConditions.workoutReportId, reportIds));
        await tx
          .delete(workoutReports)
          .where(inArray(workoutReports.id, reportIds));
      }

      await tx
        .delete(planEntries)
        .where(and(eq(planEntries.userId, userId), inArray(planEntries.id, removedIds)));
    }

    for (let index = 0; index < normalized.length; index += 1) {
      const entry = normalized[index];
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

  if ("error" in updated) {
    if (updated.error === "date_exists") {
      return NextResponse.json({ error: "date_exists" }, { status: 409 });
    }
    if (updated.error === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (updated.error === "invalid_entry_id") {
      return NextResponse.json({ error: "invalid_entry_id" }, { status: 400 });
    }
  }

  return NextResponse.json(updated);
}
