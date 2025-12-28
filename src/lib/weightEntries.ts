import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { weightEntries } from "@/db/schema";

export type WeightEntryPeriod = "morning" | "evening";

export const upsertWeightEntry = async (params: {
  userId: number;
  date: string;
  period: WeightEntryPeriod;
  weightKg: number;
}) => {
  const now = new Date();
  const [existing] = await db
    .select({ id: weightEntries.id })
    .from(weightEntries)
    .where(
      and(
        eq(weightEntries.userId, params.userId),
        eq(weightEntries.date, params.date),
        eq(weightEntries.period, params.period)
      )
    );

  if (existing) {
    await db
      .update(weightEntries)
      .set({ weightKg: String(params.weightKg), updatedAt: now })
      .where(eq(weightEntries.id, existing.id));
    return;
  }

  await db.insert(weightEntries).values({
    userId: params.userId,
    date: params.date,
    period: params.period,
    weightKg: String(params.weightKg),
    createdAt: now,
    updatedAt: now,
  });
};
