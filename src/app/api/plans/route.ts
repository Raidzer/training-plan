import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  deletePlanEntriesForDate,
  getPlanEntriesWithReportFlags,
  upsertPlanEntriesForDate,
} from "@/server/plans";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const entries = await getPlanEntriesWithReportFlags(userId, 500);

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    originalDate?: string;
    date?: string;
    isWorkload?: boolean;
    entries?: {
      id?: number;
      taskText?: string;
      commentText?: string | null;
    }[];
  } | null;

  const date = typeof body?.date === "string" ? body.date.trim() : "";
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const originalDateRaw = typeof body?.originalDate === "string" ? body.originalDate.trim() : "";
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

  const updated = await upsertPlanEntriesForDate({
    userId,
    date,
    originalDate,
    isWorkload,
    entries: normalized,
    isEdit,
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

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = (searchParams.get("date") ?? "").trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const deleted = await deletePlanEntriesForDate({ userId, date });

  if ("error" in deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(deleted);
}
