import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { telegramAccounts, telegramSubscriptions, users } from "@/server/db/schema";

export const getLinkedAccount = async (chatId: number) => {
  const [account] = await db
    .select({ userId: telegramAccounts.userId })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.chatId, chatId));
  return account ?? null;
};

export const ensureLinked = async (chatId: number) => {
  const account = await getLinkedAccount(chatId);
  return account?.userId ?? null;
};

export const getLinkedAccountDetails = async (chatId: number) => {
  const [account] = await db
    .select({
      userId: telegramAccounts.userId,
      role: users.role,
      subscribed: telegramSubscriptions.enabled,
    })
    .from(telegramAccounts)
    .innerJoin(users, eq(telegramAccounts.userId, users.id))
    .leftJoin(telegramSubscriptions, eq(telegramSubscriptions.userId, telegramAccounts.userId))
    .where(eq(telegramAccounts.chatId, chatId));

  if (!account) {
    return null;
  }

  return {
    userId: account.userId,
    role: account.role,
    subscribed: account.subscribed ?? false,
  };
};

export const getKeyboardRefreshTargets = async () => {
  const rows = await db
    .select({
      userId: telegramAccounts.userId,
      chatId: telegramAccounts.chatId,
      subscribed: telegramSubscriptions.enabled,
    })
    .from(telegramAccounts)
    .innerJoin(users, eq(telegramAccounts.userId, users.id))
    .leftJoin(telegramSubscriptions, eq(telegramSubscriptions.userId, telegramAccounts.userId))
    .where(eq(users.isActive, true));

  return rows.map((row) => ({
    userId: row.userId,
    chatId: row.chatId,
    subscribed: row.subscribed ?? false,
  }));
};

export const unlinkAccount = async (chatId: number) => {
  return db.transaction(async (tx) => {
    const accounts = await tx
      .delete(telegramAccounts)
      .where(eq(telegramAccounts.chatId, chatId))
      .returning({ id: telegramAccounts.id });
    const subscriptions = await tx
      .delete(telegramSubscriptions)
      .where(eq(telegramSubscriptions.chatId, chatId))
      .returning({ id: telegramSubscriptions.id });

    return {
      accounts: accounts.length,
      subscriptions: subscriptions.length,
    };
  });
};
