import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { recoveryEntries } from "@/db/schema";

export const upsertRecoveryEntry = async (params: {
  userId: number;
  date: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
}) => {
  const now = new Date();
  const [existing] = await db
    .select({ id: recoveryEntries.id })
    .from(recoveryEntries)
    .where(
      and(
        eq(recoveryEntries.userId, params.userId),
        eq(recoveryEntries.date, params.date)
      )
    );

  if (existing) {
    await db
      .update(recoveryEntries)
      .set({
        hasBath: params.hasBath,
        hasMfr: params.hasMfr,
        hasMassage: params.hasMassage,
        updatedAt: now,
      })
      .where(eq(recoveryEntries.id, existing.id));
    return;
  }

  await db.insert(recoveryEntries).values({
    userId: params.userId,
    date: params.date,
    hasBath: params.hasBath,
    hasMfr: params.hasMfr,
    hasMassage: params.hasMassage,
    createdAt: now,
    updatedAt: now,
  });
};
