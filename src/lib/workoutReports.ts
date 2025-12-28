import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workoutReports } from "@/db/schema";

export type WorkoutReportSummary = {
  id: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText: string | null;
  distanceKm: string | null;
};

export const getWorkoutReportByPlanEntry = async (params: {
  userId: number;
  planEntryId: number;
}): Promise<WorkoutReportSummary | null> => {
  const [report] = await db
    .select({
      id: workoutReports.id,
      planEntryId: workoutReports.planEntryId,
      date: workoutReports.date,
      startTime: workoutReports.startTime,
      resultText: workoutReports.resultText,
      commentText: workoutReports.commentText,
      distanceKm: workoutReports.distanceKm,
    })
    .from(workoutReports)
    .where(
      and(
        eq(workoutReports.userId, params.userId),
        eq(workoutReports.planEntryId, params.planEntryId)
      )
    );
  return report ?? null;
};

export const getWorkoutReportsByDate = async (params: {
  userId: number;
  date: string;
}): Promise<WorkoutReportSummary[]> => {
  return db
    .select({
      id: workoutReports.id,
      planEntryId: workoutReports.planEntryId,
      date: workoutReports.date,
      startTime: workoutReports.startTime,
      resultText: workoutReports.resultText,
      commentText: workoutReports.commentText,
      distanceKm: workoutReports.distanceKm,
    })
    .from(workoutReports)
    .where(
      and(
        eq(workoutReports.userId, params.userId),
        eq(workoutReports.date, params.date)
      )
    );
};

export const upsertWorkoutReport = async (params: {
  userId: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText?: string | null;
  distanceKm?: number | null;
}) => {
  const now = new Date();
  const updateValues: {
    date: string;
    startTime: string;
    resultText: string;
    commentText: string | null;
    updatedAt: Date;
    distanceKm?: number | null;
  } = {
    date: params.date,
    startTime: params.startTime,
    resultText: params.resultText,
    commentText: params.commentText ?? null,
    updatedAt: now,
  };
  if (params.distanceKm !== undefined) {
    updateValues.distanceKm = params.distanceKm;
  }
  const insertValues: {
    userId: number;
    planEntryId: number;
    date: string;
    startTime: string;
    resultText: string;
    commentText: string | null;
    createdAt: Date;
    updatedAt: Date;
    distanceKm?: number | null;
  } = {
    userId: params.userId,
    planEntryId: params.planEntryId,
    date: params.date,
    startTime: params.startTime,
    resultText: params.resultText,
    commentText: params.commentText ?? null,
    createdAt: now,
    updatedAt: now,
  };
  if (params.distanceKm !== undefined) {
    insertValues.distanceKm = params.distanceKm;
  }
  const [existing] = await db
    .select({ id: workoutReports.id })
    .from(workoutReports)
    .where(
      and(
        eq(workoutReports.userId, params.userId),
        eq(workoutReports.planEntryId, params.planEntryId)
      )
    );

  if (existing) {
    await db
      .update(workoutReports)
      .set(updateValues)
      .where(eq(workoutReports.id, existing.id));
    return;
  }

  await db.insert(workoutReports).values(insertValues);
};
