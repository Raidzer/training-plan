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
}) => {
  const now = new Date();
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
      .set({
        date: params.date,
        startTime: params.startTime,
        resultText: params.resultText,
        commentText: params.commentText ?? null,
        updatedAt: now,
      })
      .where(eq(workoutReports.id, existing.id));
    return;
  }

  await db.insert(workoutReports).values({
    userId: params.userId,
    planEntryId: params.planEntryId,
    date: params.date,
    startTime: params.startTime,
    resultText: params.resultText,
    commentText: params.commentText ?? null,
    createdAt: now,
    updatedAt: now,
  });
};
