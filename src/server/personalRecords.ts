import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { personalRecords, users } from "@/server/db/schema";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";
import { parsePersonalRecordTime } from "@/shared/utils/personalRecordUtils";

export type PersonalRecord = {
  distanceKey: PersonalRecordDistanceKey;
  timeText: string;
  recordDate: string;
  protocolUrl: string | null;
  raceName: string | null;
  raceCity: string | null;
};

export type PersonalRecordInput = {
  distanceKey: PersonalRecordDistanceKey;
  timeText?: string | null;
  recordDate?: string | null;
  protocolUrl?: string | null;
  raceName?: string | null;
  raceCity?: string | null;
};

export type ClubRecord = {
  id: number;
  userId: number;
  userName: string;
  userLastName: string | null;
  userGender: string;
  distanceKey: PersonalRecordDistanceKey;
  timeText: string;
  recordDate: string;
  protocolUrl: string | null;
  raceName: string | null;
  raceCity: string | null;
};

const normalizeRecordDate = (value: string | Date) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
};

export const getPersonalRecords = async (params: { userId: number }): Promise<PersonalRecord[]> => {
  const rows = await db
    .select({
      distanceKey: personalRecords.distanceKey,
      timeText: personalRecords.timeText,
      recordDate: personalRecords.recordDate,
      protocolUrl: personalRecords.protocolUrl,
      raceName: personalRecords.raceName,
      raceCity: personalRecords.raceCity,
    })
    .from(personalRecords)
    .where(eq(personalRecords.userId, params.userId));

  return rows.map((row) => ({
    distanceKey: row.distanceKey as PersonalRecordDistanceKey,
    timeText: row.timeText,
    recordDate: normalizeRecordDate(row.recordDate),
    protocolUrl: row.protocolUrl ?? null,
    raceName: row.raceName ?? null,
    raceCity: row.raceCity ?? null,
  }));
};

export const getClubRecords = async (): Promise<ClubRecord[]> => {
  const rows = await db
    .select({
      id: personalRecords.id,
      userId: personalRecords.userId,
      userName: users.name,
      userLastName: users.lastName,
      userGender: users.gender,
      distanceKey: personalRecords.distanceKey,
      timeText: personalRecords.timeText,
      recordDate: personalRecords.recordDate,
      protocolUrl: personalRecords.protocolUrl,
      raceName: personalRecords.raceName,
      raceCity: personalRecords.raceCity,
    })
    .from(personalRecords)
    .innerJoin(users, eq(users.id, personalRecords.userId))
    .where(eq(users.isActive, true));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userLastName: row.userLastName ?? null,
    userGender: row.userGender,
    distanceKey: row.distanceKey as PersonalRecordDistanceKey,
    timeText: row.timeText,
    recordDate: normalizeRecordDate(row.recordDate),
    protocolUrl: row.protocolUrl ?? null,
    raceName: row.raceName ?? null,
    raceCity: row.raceCity ?? null,
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
          raceName: record.raceName ?? null,
          raceCity: record.raceCity ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [personalRecords.userId, personalRecords.distanceKey],
          set: {
            timeText,
            recordDate,
            protocolUrl: record.protocolUrl ?? null,
            raceName: record.raceName ?? null,
            raceCity: record.raceCity ?? null,
            updatedAt: now,
          },
        });
    }
  });
};

export const improvePersonalRecord = async (params: {
  userId: number;
  record: PersonalRecordInput;
}): Promise<"updated" | "not_better" | "conflict" | "invalid_current_record"> => {
  const { userId, record } = params;
  const time = parsePersonalRecordTime(record.timeText ?? "");
  if (!time) {
    throw new Error("invalid_time");
  }
  if (!record.recordDate) {
    throw new Error("record_date_required");
  }

  const scope = and(
    eq(personalRecords.userId, userId),
    eq(personalRecords.distanceKey, record.distanceKey)
  );
  const [currentRecord] = await db
    .select({ id: personalRecords.id, timeText: personalRecords.timeText })
    .from(personalRecords)
    .where(scope);

  if (currentRecord) {
    const currentTime = parsePersonalRecordTime(currentRecord.timeText);
    if (!currentTime) {
      return "invalid_current_record";
    }
    if (time.hundredths >= currentTime.hundredths) {
      return "not_better";
    }
  }

  const values = {
    timeText: time.timeText,
    recordDate: record.recordDate,
    raceName: record.raceName ?? null,
    raceCity: record.raceCity ?? null,
    protocolUrl: record.protocolUrl ?? null,
    updatedAt: new Date(),
  };
  const savedRecords = currentRecord
    ? await db
        .update(personalRecords)
        .set(values)
        .where(
          and(
            scope,
            eq(personalRecords.id, currentRecord.id),
            eq(personalRecords.timeText, currentRecord.timeText)
          )
        )
        .returning({ id: personalRecords.id })
    : await db
        .insert(personalRecords)
        .values({
          ...values,
          userId,
          distanceKey: record.distanceKey,
          createdAt: values.updatedAt,
        })
        .onConflictDoNothing({ target: [personalRecords.userId, personalRecords.distanceKey] })
        .returning({ id: personalRecords.id });

  return savedRecords.length > 0 ? "updated" : "conflict";
};
