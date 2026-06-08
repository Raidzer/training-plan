import { and, eq, inArray, sql } from "drizzle-orm";
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
  mileageKm: string | null;
};

export type WorkoutReportShoeLimitExceeded = {
  id: number;
  name: string;
  mileageLimitKm: string;
  currentMileageKm: string;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
};

export type WorkoutReportUpsertResult = {
  limitExceededShoes: WorkoutReportShoeLimitExceeded[];
};

type WorkoutReportShoeUsage = {
  shoeId: number;
  mileageKm?: number | null;
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
      mileageKm: workoutReportShoes.mileageKm,
    })
    .from(workoutReportShoes)
    .innerJoin(shoes, eq(shoes.id, workoutReportShoes.shoeId))
    .where(inArray(workoutReportShoes.workoutReportId, reportIds));
  for (const row of rows) {
    const existing = map.get(row.reportId);
    const item = { id: row.shoeId, name: row.shoeName, mileageKm: row.mileageKm };
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
  shoeUsages?: WorkoutReportShoeUsage[] | null;
}): Promise<WorkoutReportUpsertResult> => {
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
  const shouldUpsertShoes = params.shoeIds !== undefined || params.shoeUsages !== undefined;

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

  const upsertShoes = async (
    workoutReportId: number
  ): Promise<WorkoutReportShoeLimitExceeded[]> => {
    if (!shouldUpsertShoes) {
      return [];
    }
    const previousRows = await db
      .select({
        shoeId: workoutReportShoes.shoeId,
        mileageKm: workoutReportShoes.mileageKm,
      })
      .from(workoutReportShoes)
      .where(eq(workoutReportShoes.workoutReportId, workoutReportId));
    await db
      .delete(workoutReportShoes)
      .where(eq(workoutReportShoes.workoutReportId, workoutReportId));
    const shoeUsages =
      params.shoeUsages ??
      (params.shoeIds ?? []).map((shoeId) => ({
        shoeId,
        mileageKm: null,
      }));
    if (shoeUsages.length === 0) {
      await updateShoeMileageTotals(previousRows, []);
      return [];
    }
    const values = shoeUsages.map((usage) => ({
      workoutReportId,
      shoeId: usage.shoeId,
      mileageKm:
        usage.mileageKm === null || usage.mileageKm === undefined ? null : String(usage.mileageKm),
      createdAt: now,
    }));
    await db.insert(workoutReportShoes).values(values);
    await updateShoeMileageTotals(previousRows, shoeUsages);
    return await loadLimitExceededShoes(shoeUsages.map((usage) => usage.shoeId));
  };

  const updateShoeMileageTotals = async (
    previousRows: Array<{ shoeId: number; mileageKm: string | null }>,
    nextRows: WorkoutReportShoeUsage[]
  ) => {
    const previousMileageByShoeId = new Map<number, number>();
    for (const row of previousRows) {
      const mileage = row.mileageKm === null ? 0 : Number(row.mileageKm);
      previousMileageByShoeId.set(
        row.shoeId,
        (previousMileageByShoeId.get(row.shoeId) ?? 0) + (Number.isFinite(mileage) ? mileage : 0)
      );
    }

    const nextMileageByShoeId = new Map<number, number>();
    for (const row of nextRows) {
      const mileage = row.mileageKm === null || row.mileageKm === undefined ? 0 : row.mileageKm;
      nextMileageByShoeId.set(row.shoeId, (nextMileageByShoeId.get(row.shoeId) ?? 0) + mileage);
    }

    const shoeIds = new Set([...previousMileageByShoeId.keys(), ...nextMileageByShoeId.keys()]);
    for (const shoeId of shoeIds) {
      const delta =
        Math.round(
          ((nextMileageByShoeId.get(shoeId) ?? 0) - (previousMileageByShoeId.get(shoeId) ?? 0)) *
            100
        ) / 100;
      if (delta === 0) {
        continue;
      }
      await db
        .update(shoes)
        .set({
          currentMileageKm: sql`greatest(coalesce(${shoes.currentMileageKm}, 0) + ${delta}, 0)`,
          updatedAt: now,
        })
        .where(and(eq(shoes.id, shoeId), eq(shoes.userId, params.userId)));
    }
  };

  const parseMileage = (value: string | null) => {
    if (value === null) {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  };

  const loadLimitExceededShoes = async (
    shoeIds: number[]
  ): Promise<WorkoutReportShoeLimitExceeded[]> => {
    const uniqueShoeIds = Array.from(new Set(shoeIds));
    if (uniqueShoeIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({
        id: shoes.id,
        name: shoes.name,
        mileageLimitKm: shoes.mileageLimitKm,
        currentMileageKm: shoes.currentMileageKm,
        notifyOnLimitEmail: shoes.notifyOnLimitEmail,
        notifyOnLimitTelegram: shoes.notifyOnLimitTelegram,
      })
      .from(shoes)
      .where(and(eq(shoes.userId, params.userId), inArray(shoes.id, uniqueShoeIds)));

    return rows.flatMap((row) => {
      const mileageLimitValue = row.mileageLimitKm;
      const currentMileageValue = row.currentMileageKm;
      if (mileageLimitValue === null || currentMileageValue === null) {
        return [];
      }

      const mileageLimitKm = parseMileage(mileageLimitValue);
      const currentMileageKm = parseMileage(currentMileageValue);
      if (mileageLimitKm === null || currentMileageKm === null) {
        return [];
      }
      if (currentMileageKm <= mileageLimitKm) {
        return [];
      }

      return [
        {
          id: row.id,
          name: row.name,
          mileageLimitKm: mileageLimitValue,
          currentMileageKm: currentMileageValue,
          notifyOnLimitEmail: row.notifyOnLimitEmail,
          notifyOnLimitTelegram: row.notifyOnLimitTelegram,
        },
      ];
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
    await db.update(workoutReports).set(updateValues).where(eq(workoutReports.id, existing.id));
    await upsertConditions(existing.id);
    const limitExceededShoes = await upsertShoes(existing.id);
    return { limitExceededShoes };
  }

  const [inserted] = await db
    .insert(workoutReports)
    .values(insertValues)
    .returning({ id: workoutReports.id });
  if (inserted) {
    await upsertConditions(inserted.id);
    const limitExceededShoes = await upsertShoes(inserted.id);
    return { limitExceededShoes };
  }

  return { limitExceededShoes: [] };
};
