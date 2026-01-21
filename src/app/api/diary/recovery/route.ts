import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isValidDateString } from "@/lib/diary";
import { upsertRecoveryEntry } from "@/lib/recoveryEntries";

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return null;
};

const parseOptionalScore = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    return { value: null, valid: false };
  }
  return { value: parsed, valid: true };
};

const parseOptionalSleepHours = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) {
    return { value: null, valid: false };
  }
  return { value: parsed, valid: true };
};

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
    date?: string;
    hasBath?: boolean | string;
    hasMfr?: boolean | string;
    hasMassage?: boolean | string;
    overallScore?: number | string | null;
    functionalScore?: number | string | null;
    muscleScore?: number | string | null;
    sleepHours?: number | string | null;
  } | null;

  const date = body?.date ?? null;
  if (!date || !isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const hasBath = parseBoolean(body?.hasBath);
  const hasMfr = parseBoolean(body?.hasMfr);
  const hasMassage = parseBoolean(body?.hasMassage);
  const overallScore = parseOptionalScore(body?.overallScore);
  const functionalScore = parseOptionalScore(body?.functionalScore);
  const muscleScore = parseOptionalScore(body?.muscleScore);
  const sleepHours = parseOptionalSleepHours(body?.sleepHours);

  if (
    hasBath === null ||
    hasMfr === null ||
    hasMassage === null ||
    !overallScore.valid ||
    !functionalScore.valid ||
    !muscleScore.valid ||
    !sleepHours.valid
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const upsertParams: Parameters<typeof upsertRecoveryEntry>[0] = {
    userId,
    date,
    hasBath,
    hasMfr,
    hasMassage,
  };
  if (overallScore.value !== undefined) {
    upsertParams.overallScore = overallScore.value;
  }
  if (functionalScore.value !== undefined) {
    upsertParams.functionalScore = functionalScore.value;
  }
  if (muscleScore.value !== undefined) {
    upsertParams.muscleScore = muscleScore.value;
  }
  if (sleepHours.value !== undefined) {
    upsertParams.sleepHours = sleepHours.value;
  }

  await upsertRecoveryEntry(upsertParams);

  return NextResponse.json({ ok: true });
}
