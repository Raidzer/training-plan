import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { planEntries } from "@/db/schema";
import { isValidDateString } from "@/lib/diary";
import { upsertWorkoutReport } from "@/lib/workoutReports";

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        planEntryId?: number | string;
        date?: string;
        startTime?: string;
        resultText?: string;
        commentText?: string | null;
      }
    | null;

  const planEntryId = Number(body?.planEntryId);
  const date = body?.date ?? null;
  const startTime = typeof body?.startTime === "string" ? body.startTime.trim() : "";
  const resultText =
    typeof body?.resultText === "string" ? body.resultText.trim() : "";
  const commentText =
    typeof body?.commentText === "string" ? body.commentText.trim() : null;

  if (!Number.isFinite(planEntryId) || planEntryId <= 0) {
    return NextResponse.json({ error: "invalid_plan_entry" }, { status: 400 });
  }
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (!TIME_REGEX.test(startTime)) {
    return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  }
  if (!resultText) {
    return NextResponse.json({ error: "invalid_result" }, { status: 400 });
  }

  const [entry] = await db
    .select({ id: planEntries.id, date: planEntries.date })
    .from(planEntries)
    .where(and(eq(planEntries.id, planEntryId), eq(planEntries.userId, userId)));
  if (!entry) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (entry.date !== date) {
    return NextResponse.json({ error: "date_mismatch" }, { status: 400 });
  }

  await upsertWorkoutReport({
    userId,
    planEntryId,
    date: entry.date,
    startTime,
    resultText,
    commentText: commentText && commentText.length > 0 ? commentText : null,
  });

  return NextResponse.json({ ok: true });
}
