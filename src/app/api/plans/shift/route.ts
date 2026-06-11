import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { shiftPlanEntriesFromDate } from "@/server/plans";

const PLAN_SHIFT_MAX_ABS_DAYS = 30;
const PLAN_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
    fromDate?: string;
    offsetDays?: number | string;
  } | null;

  const fromDate = typeof body?.fromDate === "string" ? body.fromDate.trim() : "";
  if (!fromDate || !PLAN_DATE_REGEX.test(fromDate)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const offsetDays = Number(body?.offsetDays);
  if (
    !Number.isInteger(offsetDays) ||
    offsetDays === 0 ||
    Math.abs(offsetDays) > PLAN_SHIFT_MAX_ABS_DAYS
  ) {
    return NextResponse.json({ error: "invalid_shift" }, { status: 400 });
  }

  const shifted = await shiftPlanEntriesFromDate({
    userId,
    fromDate,
    offsetDays,
  }).catch((error) => {
    console.error(error);
    return { error: "server_error" as const };
  });

  if ("error" in shifted) {
    if (shifted.error === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (shifted.error === "date_locked_by_report" || shifted.error === "target_date_exists") {
      return NextResponse.json({ error: shifted.error }, { status: 409 });
    }
    if (shifted.error === "invalid_shift") {
      return NextResponse.json({ error: "invalid_shift" }, { status: 400 });
    }
    if (shifted.error === "server_error") {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  }

  return NextResponse.json(shifted);
}
