import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  planEntries,
  shoes,
  workoutReportConditions,
  workoutReportShoes,
  workoutReports,
} from "@/server/db/schema";

export type WorkoutReportShoe = {
  id: number;
  name: string;
};

export type WorkoutReportSummary = {
  id: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText: string | null;
  distanceKm: string | null;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  weather: string | null;
  hasWind: boolean | null;
  temperatureC: string | null;
  surface: string | null;
  shoes: WorkoutReportShoe[];
};

const loadReportShoes = async (reportIds: number[]) => {
  const map = new Map<number, WorkoutReportShoe[]>();
  if (reportIds.length === 0) {
    return map;
  }
  const rows = await db
    .select({
      reportId: workoutReportShoes.workoutReportId,
      shoeId: workoutReportShoes.shoeId,
      shoeName: shoes.name,
    })
    .from(workoutReportShoes)
    .innerJoin(shoes, eq(shoes.id, workoutReportShoes.shoeId))
    .where(inArray(workoutReportShoes.workoutReportId, reportIds));
  for (const row of rows) {
    const existing = map.get(row.reportId);
    const item = { id: row.shoeId, name: row.shoeName };
    if (!existing) {
      map.set(row.reportId, [item]);
    } else {
      existing.push(item);
    }
  }
  return map;
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
      overallScore: workoutReports.overallScore,
      functionalScore: workoutReports.functionalScore,
      muscleScore: workoutReports.muscleScore,
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
  if (!report) {
    return null;
  }
  const shoesMap = await loadReportShoes([report.id]);
  return {
    ...report,
    shoes: shoesMap.get(report.id) ?? [],
  };
};

export const getWorkoutReportsByDate = async (params: {
  userId: number;
  date: string;
}): Promise<WorkoutReportSummary[]> => {
  const reports = await db
    .select({
      id: workoutReports.id,
      planEntryId: workoutReports.planEntryId,
      date: workoutReports.date,
      startTime: workoutReports.startTime,
      resultText: workoutReports.resultText,
      commentText: workoutReports.commentText,
      distanceKm: workoutReports.distanceKm,
      overallScore: workoutReports.overallScore,
      functionalScore: workoutReports.functionalScore,
      muscleScore: workoutReports.muscleScore,
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
    .where(and(eq(workoutReports.userId, params.userId), eq(workoutReports.date, params.date)));
  const reportIds = reports.map((report) => report.id);
  const shoesMap = await loadReportShoes(reportIds);
  return reports.map((report) => ({
    ...report,
    shoes: shoesMap.get(report.id) ?? [],
  }));
};

export const getPlanEntrySummaryForUser = async (params: {
  userId: number;
  planEntryId: number;
}): Promise<{ id: number; date: string } | null> => {
  const [entry] = await db
    .select({ id: planEntries.id, date: planEntries.date })
    .from(planEntries)
    .where(and(eq(planEntries.id, params.planEntryId), eq(planEntries.userId, params.userId)));

  if (!entry) {
    return null;
  }

  return entry;
};

export const areShoesOwnedByUser = async (params: {
  userId: number;
  shoeIds: number[];
}): Promise<boolean> => {
  if (params.shoeIds.length === 0) {
    return true;
  }

  const rows = await db
    .select({ id: shoes.id })
    .from(shoes)
    .where(and(eq(shoes.userId, params.userId), inArray(shoes.id, params.shoeIds)));

  return rows.length === params.shoeIds.length;
};

export const upsertWorkoutReport = async (params: {
  userId: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText?: string | null;
  distanceKm?: number | null;
  overallScore?: number | null;
  functionalScore?: number | null;
  muscleScore?: number | null;
  weather?: string | null;
  hasWind?: boolean | null;
  temperatureC?: number | null;
  surface?: string | null;
  shoeIds?: number[] | null;
}) => {
  const now = new Date();
  const updateValues: {
    date: string;
    startTime: string;
    resultText: string;
    commentText: string | null;
    updatedAt: Date;
    distanceKm?: string | null;
    overallScore?: number | null;
    functionalScore?: number | null;
    muscleScore?: number | null;
  } = {
    date: params.date,
    startTime: params.startTime,
    resultText: params.resultText,
    commentText: params.commentText ?? null,
    updatedAt: now,
  };
  if (params.distanceKm !== undefined) {
    updateValues.distanceKm = params.distanceKm === null ? null : String(params.distanceKm);
  }
  if (params.overallScore !== undefined) {
    updateValues.overallScore = params.overallScore;
  }
  if (params.functionalScore !== undefined) {
    updateValues.functionalScore = params.functionalScore;
  }
  if (params.muscleScore !== undefined) {
    updateValues.muscleScore = params.muscleScore;
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
    overallScore?: number | null;
    functionalScore?: number | null;
    muscleScore?: number | null;
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
    insertValues.distanceKm = params.distanceKm === null ? null : String(params.distanceKm);
  }
  if (params.overallScore !== undefined) {
    insertValues.overallScore = params.overallScore;
  }
  if (params.functionalScore !== undefined) {
    insertValues.functionalScore = params.functionalScore;
  }
  if (params.muscleScore !== undefined) {
    insertValues.muscleScore = params.muscleScore;
  }

  const shouldUpsertConditions = [
    params.weather,
    params.hasWind,
    params.temperatureC,
    params.surface,
  ].some((value) => value !== undefined);
  const shouldUpsertShoes = params.shoeIds !== undefined;

  const upsertConditions = async (workoutReportId: number) => {
    if (!shouldUpsertConditions) {
      return;
    }
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
      updateSet.temperatureC = params.temperatureC === null ? null : String(params.temperatureC);
    }
    if (params.surface !== undefined) {
      updateSet.surface = params.surface ?? null;
    }

    await db.insert(workoutReportConditions).values(insertValues).onConflictDoUpdate({
      target: workoutReportConditions.workoutReportId,
      set: updateSet,
    });
  };

  const upsertShoes = async (workoutReportId: number) => {
    if (!shouldUpsertShoes) {
      return;
    }
    await db
      .delete(workoutReportShoes)
      .where(eq(workoutReportShoes.workoutReportId, workoutReportId));
    const shoeIds = params.shoeIds ?? [];
    if (shoeIds.length === 0) {
      return;
    }
    const values = shoeIds.map((shoeId) => ({
      workoutReportId,
      shoeId,
      createdAt: now,
    }));
    await db.insert(workoutReportShoes).values(values);
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
    await db.update(workoutReports).set(updateValues).where(eq(workoutReports.id, existing.id));
    await upsertConditions(existing.id);
    await upsertShoes(existing.id);
    return;
  }

  const [inserted] = await db
    .insert(workoutReports)
    .values(insertValues)
    .returning({ id: workoutReports.id });
  if (inserted) {
    await upsertConditions(inserted.id);
    await upsertShoes(inserted.id);
  }
};
