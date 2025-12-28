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

  const days = await getDiaryDaysInRange({
    userId,
    from,
    to,
    includeEmpty: true,
  });

  const totals = days.reduce(
    (acc, day) => {
      if (day.dayHasReport) acc.daysComplete += 1;
      acc.workoutsTotal += day.workoutsTotal;
      acc.workoutsWithFullReport += day.workoutsWithFullReport;
      if (day.hasWeightMorning) acc.weightEntries += 1;
      if (day.hasWeightEvening) acc.weightEntries += 1;
      return acc;
    },
    {
      daysComplete: 0,
      workoutsTotal: 0,
      workoutsWithFullReport: 0,
      weightEntries: 0,
    }
  );

  return NextResponse.json({ days, totals });
}
