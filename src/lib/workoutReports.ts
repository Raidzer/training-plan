import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workoutReportConditions, workoutReports } from "@/db/schema";

export type WorkoutReportSummary = {
  id: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText: string | null;
  distanceKm: string | null;
  weather: string | null;
  hasWind: boolean | null;
  temperatureC: string | null;
  surface: string | null;
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
      weather: workoutReportConditions.weather,
      hasWind: workoutReportConditions.hasWind,
      temperatureC: workoutReportConditions.temperatureC,
      surface: workoutReportConditions.surface,
    })
    .from(workoutReports)
    .leftJoin(
      workoutReportConditions,
      eq(workoutReportConditions.workoutReportId, workoutReports.id)
    )
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
      weather: workoutReportConditions.weather,
      hasWind: workoutReportConditions.hasWind,
      temperatureC: workoutReportConditions.temperatureC,
      surface: workoutReportConditions.surface,
    })
    .from(workoutReports)
    .leftJoin(
      workoutReportConditions,
      eq(workoutReportConditions.workoutReportId, workoutReports.id)
    )
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
  weather?: string | null;
  hasWind?: boolean | null;
  temperatureC?: number | null;
  surface?: string | null;
}) => {
  const now = new Date();
  const updateValues: {
    date: string;
    startTime: string;
    resultText: string;
    commentText: string | null;
    updatedAt: Date;
    distanceKm?: string | null;
  } = {
    date: params.date,
    startTime: params.startTime,
    resultText: params.resultText,
    commentText: params.commentText ?? null,
    updatedAt: now,
  };
  if (params.distanceKm !== undefined) {
    updateValues.distanceKm =
      params.distanceKm === null ? null : String(params.distanceKm);
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
    distanceKm?: string | null;
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
    insertValues.distanceKm =
      params.distanceKm === null ? null : String(params.distanceKm);
  }

  const shouldUpsertConditions = [
    params.weather,
    params.hasWind,
    params.temperatureC,
    params.surface,
  ].some((value) => value !== undefined);

  const upsertConditions = async (workoutReportId: number) => {
    if (!shouldUpsertConditions) return;
    const insertValues: {
      workoutReportId: number;
      weather: string | null;
      hasWind: boolean | null;
      temperatureC: string | null;
      surface: string | null;
      createdAt: Date;
      updatedAt: Date;
    } = {
      workoutReportId,
      weather: params.weather ?? null,
      hasWind: params.hasWind ?? null,
      temperatureC:
        params.temperatureC === undefined
          ? null
          : params.temperatureC === null
          ? null
          : String(params.temperatureC),
      surface: params.surface ?? null,
      createdAt: now,
      updatedAt: now,
    };
    const updateSet: {
      weather?: string | null;
      hasWind?: boolean | null;
      temperatureC?: string | null;
      surface?: string | null;
      updatedAt: Date;
    } = { updatedAt: now };
    if (params.weather !== undefined) {
      updateSet.weather = params.weather ?? null;
    }
    if (params.hasWind !== undefined) {
      updateSet.hasWind = params.hasWind ?? null;
    }
    if (params.temperatureC !== undefined) {
      updateSet.temperatureC =
        params.temperatureC === null ? null : String(params.temperatureC);
    }
    if (params.surface !== undefined) {
      updateSet.surface = params.surface ?? null;
    }

    await db
      .insert(workoutReportConditions)
      .values(insertValues)
      .onConflictDoUpdate({
        target: workoutReportConditions.workoutReportId,
        set: updateSet,
      });
  };

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
    await upsertConditions(existing.id);
    return;
  }

  const [inserted] = await db
    .insert(workoutReports)
    .values(insertValues)
    .returning({ id: workoutReports.id });
  if (inserted) {
    await upsertConditions(inserted.id);
  }
};
