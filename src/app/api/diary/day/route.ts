import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDiaryDayData, isValidDateString } from "@/lib/diary";

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
  const date = searchParams.get("date");
  if (!date || !isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const data = await getDiaryDayData({ userId, date });
  return NextResponse.json({ date, ...data });
}
