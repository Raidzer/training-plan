import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildTelegramBotUrl } from "@/server/telegramLink";
import {
  getLatestTelegramLinkCodeSummary,
  getTelegramAccountSummary,
  getTelegramSubscriptionSummary,
} from "@/server/telegram";

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getTelegramAccountSummary(userId);
  const subscription = await getTelegramSubscriptionSummary(userId);
  const codeRow = await getLatestTelegramLinkCodeSummary(userId);
  const botUrl = buildTelegramBotUrl(process.env.TELEGRAM_BOT_USERNAME);

  return NextResponse.json({
    linked: Boolean(account),
    botUrl,
    telegram: account
      ? {
          username: account.username,
          firstName: account.firstName,
          linkedAt: account.linkedAt,
        }
      : null,
    subscription: subscription
      ? {
          enabled: subscription.enabled,
          timezone: subscription.timezone,
          sendTime: subscription.sendTime,
        }
      : null,
    codeExpiresAt: codeRow?.expiresAt ?? null,
    codeConsumedAt: codeRow?.consumedAt ?? null,
  });
}
