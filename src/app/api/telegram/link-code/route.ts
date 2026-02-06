import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueTelegramLinkCode } from "@/server/telegramLink";
import { getTelegramAccountIdByUserId } from "@/server/telegram";

export async function POST() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const existingAccountId = await getTelegramAccountIdByUserId(userId);

  if (existingAccountId) {
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
