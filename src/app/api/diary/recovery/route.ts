import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isValidDateString } from "@/lib/diary";
import { upsertRecoveryEntry } from "@/lib/recoveryEntries";

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return null;
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

  const body = (await req.json().catch(() => null)) as
    | {
        date?: string;
        hasBath?: boolean | string;
        hasMfr?: boolean | string;
        hasMassage?: boolean | string;
      }
    | null;

  const date = body?.date ?? null;
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const hasBath = parseBoolean(body?.hasBath);
  const hasMfr = parseBoolean(body?.hasMfr);
  const hasMassage = parseBoolean(body?.hasMassage);

  if (hasBath === null || hasMfr === null || hasMassage === null) {
    return NextResponse.json({ error: "invalid_flags" }, { status: 400 });
  }

  await upsertRecoveryEntry({
    userId,
    date,
    hasBath,
    hasMfr,
    hasMassage,
  });

  return NextResponse.json({ ok: true });
}
