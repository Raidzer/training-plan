import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isValidDateString } from "@/lib/diary";
import { upsertWeightEntry } from "@/lib/weightEntries";

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
    | { date?: string; period?: string; weightKg?: number | string }
    | null;

  const date = body?.date ?? null;
  const period = body?.period ?? null;
  const weightKg = Number(body?.weightKg);

  if (!date || !isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (period !== "morning" && period !== "evening") {
    return NextResponse.json({ error: "invalid_period" }, { status: 400 });
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return NextResponse.json({ error: "invalid_weight" }, { status: 400 });
  }

  await upsertWeightEntry({
    userId,
    date,
    period,
    weightKg,
  });

  return NextResponse.json({ ok: true });
}
