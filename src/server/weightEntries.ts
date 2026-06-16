import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { weightEntries } from "@/server/db/schema";

export type WeightEntryPeriod = "morning" | "evening";

export const getLatestWeightEntry = async (params: { userId: number }) => {
  const [entry] = await db
    .select({
      weightKg: weightEntries.weightKg,
    })
    .from(weightEntries)
    .where(eq(weightEntries.userId, params.userId))
    .orderBy(desc(weightEntries.date), asc(weightEntries.period))
    .limit(1);

  return entry?.weightKg ? String(entry.weightKg) : null;
};

export const upsertWeightEntry = async (params: {
  userId: number;
  date: string;
  period: WeightEntryPeriod;
  weightKg: number;
}) => {
  const now = new Date();
  const weightValue = Math.round(params.weightKg * 10) / 10;
  const weightText = weightValue.toFixed(1);
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
      .set({ weightKg: weightText, updatedAt: now })
      .where(eq(weightEntries.id, existing.id));
    return;
  }

  await db.insert(weightEntries).values({
    userId: params.userId,
    date: params.date,
    period: params.period,
    weightKg: weightText,
    createdAt: now,
    updatedAt: now,
  });
};
