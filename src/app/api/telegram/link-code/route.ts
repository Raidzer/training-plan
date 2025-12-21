import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { telegramAccounts } from "@/db/schema";
import { issueTelegramLinkCode } from "@/lib/telegramLink";

export async function POST() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select({ id: telegramAccounts.id })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.userId, userId));

  if (existing) {
    return NextResponse.json({ error: "already-linked" }, { status: 409 });
  }

  try {
    const { code, expiresAt } = await issueTelegramLinkCode({ userId });

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to issue telegram link code", error);
    return NextResponse.json({ error: "issue-failed" }, { status: 500 });
  }
}
