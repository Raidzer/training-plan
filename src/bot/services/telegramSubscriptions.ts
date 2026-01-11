import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { telegramSubscriptions, users } from "@/db/schema";

export const getSubscription = async (userId: number) => {
  const [subscription] = await db
    .select({
      id: telegramSubscriptions.id,
      timezone: users.timezone,
      sendTime: telegramSubscriptions.sendTime,
      enabled: telegramSubscriptions.enabled,
    })
    .from(telegramSubscriptions)
    .innerJoin(users, eq(telegramSubscriptions.userId, users.id))
    .where(eq(telegramSubscriptions.userId, userId));
  return subscription ?? null;
};

export const upsertSubscription = async (params: {
  userId: number;
  chatId: number;
  patch: Partial<{
    timezone: string | null;
    sendTime: string | null;
    enabled: boolean;
  }>;
}) => {
  const now = new Date();
  const [existing] = await db
    .select({ id: telegramSubscriptions.id })
    .from(telegramSubscriptions)
    .where(eq(telegramSubscriptions.userId, params.userId));

  const { timezone, ...subPatch } = params.patch;

  if (timezone) {
    await db.update(users).set({ timezone }).where(eq(users.id, params.userId));
  }

  if (existing) {
    if (Object.keys(subPatch).length > 0) {
      await db
        .update(telegramSubscriptions)
        .set({ ...subPatch, updatedAt: now })
        .where(eq(telegramSubscriptions.id, existing.id));
    }
  } else {
    // For new subscription, we might not have updated timezone if it wasn't in patch
    // But timezone is on users table, which must exist for userId to verify
    await db.insert(telegramSubscriptions).values({
      userId: params.userId,
      chatId: params.chatId,
      enabled: false,
      sendTime: null,
      ...subPatch,
      createdAt: now,
      updatedAt: now,
    });
  }
};

export const getEnabledSubscriptions = async () => {
  return db
    .select({
      id: telegramSubscriptions.id,
      userId: telegramSubscriptions.userId,
      chatId: telegramSubscriptions.chatId,
      timezone: users.timezone,
      sendTime: telegramSubscriptions.sendTime,
      lastSentOn: telegramSubscriptions.lastSentOn,
    })
    .from(telegramSubscriptions)
    .innerJoin(users, eq(telegramSubscriptions.userId, users.id))
    .where(eq(telegramSubscriptions.enabled, true));
};

export const markSubscriptionSent = async (params: { id: number; sentOn: string }) => {
  await db
    .update(telegramSubscriptions)
    .set({ lastSentOn: params.sentOn, updatedAt: new Date() })
    .where(eq(telegramSubscriptions.id, params.id));
};
