import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { personalRecords } from "@/db/schema";
import type { PersonalRecordDistanceKey } from "./personalRecords.constants";

export type PersonalRecord = {
  distanceKey: PersonalRecordDistanceKey;
  timeText: string;
  recordDate: string;
  protocolUrl: string | null;
};

export type PersonalRecordInput = {
  distanceKey: PersonalRecordDistanceKey;
  timeText?: string | null;
  recordDate?: string | null;
  protocolUrl?: string | null;
};

const normalizeRecordDate = (value: string | Date) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
};

export const getPersonalRecords = async (params: {
  userId: number;
}): Promise<PersonalRecord[]> => {
  const rows = await db
    .select({
      distanceKey: personalRecords.distanceKey,
      timeText: personalRecords.timeText,
      recordDate: personalRecords.recordDate,
      protocolUrl: personalRecords.protocolUrl,
    })
    .from(personalRecords)
    .where(eq(personalRecords.userId, params.userId));

  return rows.map((row) => ({
    distanceKey: row.distanceKey as PersonalRecordDistanceKey,
    timeText: row.timeText,
    recordDate: normalizeRecordDate(row.recordDate),
    protocolUrl: row.protocolUrl ?? null,
  }));
};

export const upsertPersonalRecords = async (params: {
  userId: number;
  records: PersonalRecordInput[];
}) => {
  const now = new Date();
  await db.transaction(async (tx) => {
    for (const record of params.records) {
      const timeText = typeof record.timeText === "string" ? record.timeText.trim() : "";
      if (!timeText) {
        await tx
          .delete(personalRecords)
          .where(
            and(
              eq(personalRecords.userId, params.userId),
              eq(personalRecords.distanceKey, record.distanceKey)
            )
          );
        continue;
      }

      const recordDate = record.recordDate ?? "";
      if (!recordDate) {
        throw new Error("record_date_required");
      }

      await tx
        .insert(personalRecords)
        .values({
          userId: params.userId,
          distanceKey: record.distanceKey,
          timeText,
          recordDate,
          protocolUrl: record.protocolUrl ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [personalRecords.userId, personalRecords.distanceKey],
          set: {
            timeText,
            recordDate,
            protocolUrl: record.protocolUrl ?? null,
            updatedAt: now,
          },
        });
    }
  });
};
