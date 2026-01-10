import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { telegramSubscriptions } from "@/db/schema";

export const getSubscription = async (userId: number) => {
  const [subscription] = await db
    .select({
      id: telegramSubscriptions.id,
      timezone: telegramSubscriptions.timezone,
      sendTime: telegramSubscriptions.sendTime,
      enabled: telegramSubscriptions.enabled,
    })
    .from(telegramSubscriptions)
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

  if (existing) {
    await db
      .update(telegramSubscriptions)
      .set({ ...params.patch, updatedAt: now })
      .where(eq(telegramSubscriptions.id, existing.id));
  } else {
    await db.insert(telegramSubscriptions).values({
      userId: params.userId,
      chatId: params.chatId,
      enabled: false,
      timezone: null,
      sendTime: null,
      ...params.patch,
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
      timezone: telegramSubscriptions.timezone,
      sendTime: telegramSubscriptions.sendTime,
      lastSentOn: telegramSubscriptions.lastSentOn,
    })
    .from(telegramSubscriptions)
    .where(eq(telegramSubscriptions.enabled, true));
};

export const markSubscriptionSent = async (params: { id: number; sentOn: string }) => {
  await db
    .update(telegramSubscriptions)
    .set({ lastSentOn: params.sentOn, updatedAt: new Date() })
    .where(eq(telegramSubscriptions.id, params.id));
};
