import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildTelegramDeepLinkUrl, issueTelegramLinkCode } from "@/server/telegramLink";
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
    const { code, linkToken, expiresAt } = await issueTelegramLinkCode({ userId });
    const linkUrl = buildTelegramDeepLinkUrl({
      username: process.env.TELEGRAM_BOT_USERNAME,
      payload: linkToken,
    });

    return NextResponse.json({
      code,
      linkUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to issue telegram link code", error);
    return NextResponse.json({ error: "issue-failed" }, { status: 500 });
  }
}
