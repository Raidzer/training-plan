import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { telegramAccounts, telegramLinkCodes, telegramSubscriptions, users } from "@/db/schema";

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [account] = await db
    .select({
      username: telegramAccounts.username,
      firstName: telegramAccounts.firstName,
      linkedAt: telegramAccounts.linkedAt,
    })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.userId, userId));

  const [subscription] = await db
    .select({
      enabled: telegramSubscriptions.enabled,
      timezone: users.timezone,
      sendTime: telegramSubscriptions.sendTime,
    })
    .from(telegramSubscriptions)
    .innerJoin(users, eq(telegramSubscriptions.userId, users.id))
    .where(eq(telegramSubscriptions.userId, userId));

  const [codeRow] = await db
    .select({
      expiresAt: telegramLinkCodes.expiresAt,
      consumedAt: telegramLinkCodes.consumedAt,
    })
    .from(telegramLinkCodes)
    .where(eq(telegramLinkCodes.userId, userId))
    .orderBy(desc(telegramLinkCodes.createdAt))
    .limit(1);

  return NextResponse.json({
    linked: Boolean(account),
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
