import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  telegramAccounts,
  telegramLinkCodes,
  telegramSubscriptions,
  users,
} from "@/server/db/schema";

type TelegramAccountSummary = {
  username: string | null;
  firstName: string | null;
  linkedAt: Date | null;
};

type TelegramSubscriptionSummary = {
  enabled: boolean;
  timezone: string | null;
  sendTime: string | null;
};

type TelegramLatestLinkCodeSummary = {
  expiresAt: Date;
  consumedAt: Date | null;
};

type TelegramSubscriptionSettingsPatch = {
  enabled: boolean;
  sendTime: string | null;
};

export async function getTelegramAccountIdByUserId(userId: number): Promise<number | null> {
  const [existing] = await db
    .select({ id: telegramAccounts.id })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.userId, userId));

  if (!existing) {
    return null;
  }

  return existing.id;
}

export async function getTelegramAccountSummary(
  userId: number
): Promise<TelegramAccountSummary | null> {
  const [account] = await db
    .select({
      username: telegramAccounts.username,
      firstName: telegramAccounts.firstName,
      linkedAt: telegramAccounts.linkedAt,
    })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.userId, userId));

  if (!account) {
    return null;
  }

  return account;
}

export async function getTelegramSubscriptionSummary(
  userId: number
): Promise<TelegramSubscriptionSummary | null> {
  const [subscription] = await db
    .select({
      enabled: telegramSubscriptions.enabled,
      timezone: users.timezone,
      sendTime: telegramSubscriptions.sendTime,
    })
    .from(telegramSubscriptions)
    .innerJoin(users, eq(telegramSubscriptions.userId, users.id))
    .where(eq(telegramSubscriptions.userId, userId));

  if (!subscription) {
    return null;
  }

  return subscription;
}

export async function getLatestTelegramLinkCodeSummary(
  userId: number
): Promise<TelegramLatestLinkCodeSummary | null> {
  const [codeRow] = await db
    .select({
      expiresAt: telegramLinkCodes.expiresAt,
      consumedAt: telegramLinkCodes.consumedAt,
    })
    .from(telegramLinkCodes)
    .where(eq(telegramLinkCodes.userId, userId))
    .orderBy(desc(telegramLinkCodes.createdAt))
    .limit(1);

  if (!codeRow) {
    return null;
  }

  return codeRow;
}

export async function updateTelegramSubscriptionSettings(
  userId: number,
  patch: TelegramSubscriptionSettingsPatch
): Promise<TelegramSubscriptionSummary | null> {
  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [account] = await tx
      .select({ chatId: telegramAccounts.chatId })
      .from(telegramAccounts)
      .where(eq(telegramAccounts.userId, userId));

    if (!account) {
      return null;
    }

    const [subscription] = await tx
      .select({ id: telegramSubscriptions.id })
      .from(telegramSubscriptions)
      .where(eq(telegramSubscriptions.userId, userId));

    if (subscription) {
      await tx
        .update(telegramSubscriptions)
        .set({
          enabled: patch.enabled,
          sendTime: patch.sendTime,
          updatedAt: now,
        })
        .where(eq(telegramSubscriptions.id, subscription.id));
    } else {
      await tx.insert(telegramSubscriptions).values({
        userId,
        chatId: account.chatId,
        enabled: patch.enabled,
        sendTime: patch.sendTime,
        createdAt: now,
        updatedAt: now,
      });
    }

    return true;
  });

  if (!updated) {
    return null;
  }

  return await getTelegramSubscriptionSummary(userId);
}

export async function unlinkTelegramAccount(userId: number) {
  return await db.transaction(async (tx) => {
    const accounts = await tx
      .delete(telegramAccounts)
      .where(eq(telegramAccounts.userId, userId))
      .returning({ id: telegramAccounts.id });
    const subscriptions = await tx
      .delete(telegramSubscriptions)
      .where(eq(telegramSubscriptions.userId, userId))
      .returning({ id: telegramSubscriptions.id });
    const codes = await tx
      .delete(telegramLinkCodes)
      .where(eq(telegramLinkCodes.userId, userId))
      .returning({ id: telegramLinkCodes.id });

    return {
      accounts: accounts.length,
      subscriptions: subscriptions.length,
      codes: codes.length,
    };
  });
}
