import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDiaryDaysInRange, isValidDateString } from "@/lib/diary";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to || !isValidDateString(from) || !isValidDateString(to)) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const days = await getDiaryDaysInRange({ userId, from, to });
  return NextResponse.json({ days });
}
