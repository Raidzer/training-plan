import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { recoveryEntries } from "@/db/schema";

export const upsertRecoveryEntry = async (params: {
  userId: number;
  date: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  overallScore?: number | null;
  functionalScore?: number | null;
  muscleScore?: number | null;
  sleepHours?: number | null;
}) => {
  const now = new Date();
  const updates: {
    hasBath: boolean;
    hasMfr: boolean;
    hasMassage: boolean;
    updatedAt: Date;
    overallScore?: number | null;
    functionalScore?: number | null;
    muscleScore?: number | null;
    sleepHours?: string | null;
  } = {
    hasBath: params.hasBath,
    hasMfr: params.hasMfr,
    hasMassage: params.hasMassage,
    updatedAt: now,
  };
  if (params.overallScore !== undefined) {
    updates.overallScore = params.overallScore;
  }
  if (params.functionalScore !== undefined) {
    updates.functionalScore = params.functionalScore;
  }
  if (params.muscleScore !== undefined) {
    updates.muscleScore = params.muscleScore;
  }
  if (params.sleepHours !== undefined) {
    updates.sleepHours =
      params.sleepHours === null ? null : String(params.sleepHours);
  }

  const insertValues: {
    userId: number;
    date: string;
    hasBath: boolean;
    hasMfr: boolean;
    hasMassage: boolean;
    createdAt: Date;
    updatedAt: Date;
    overallScore?: number | null;
    functionalScore?: number | null;
    muscleScore?: number | null;
    sleepHours?: string | null;
  } = {
    userId: params.userId,
    date: params.date,
    hasBath: params.hasBath,
    hasMfr: params.hasMfr,
    hasMassage: params.hasMassage,
    createdAt: now,
    updatedAt: now,
  };
  if (params.overallScore !== undefined) {
    insertValues.overallScore = params.overallScore;
  }
  if (params.functionalScore !== undefined) {
    insertValues.functionalScore = params.functionalScore;
  }
  if (params.muscleScore !== undefined) {
    insertValues.muscleScore = params.muscleScore;
  }
  if (params.sleepHours !== undefined) {
    insertValues.sleepHours =
      params.sleepHours === null ? null : String(params.sleepHours);
  }
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
      .set(updates)
      .where(eq(recoveryEntries.id, existing.id));
    return;
  }

  await db.insert(recoveryEntries).values(insertValues);
};
