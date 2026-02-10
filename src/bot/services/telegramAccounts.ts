import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { telegramAccounts, telegramSubscriptions } from "@/server/db/schema";

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
