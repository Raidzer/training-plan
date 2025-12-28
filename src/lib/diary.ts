import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  planEntries,
  recoveryEntries,
  weightEntries,
  workoutReports,
} from "@/db/schema";

export type DiaryPlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
};

export type DiaryWorkoutReport = {
  id: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText: string | null;
};

export type DiaryWeightEntry = {
  id: number;
  date: string;
  period: string;
  weightKg: string;
};

export type DiaryRecoveryEntry = {
  id?: number;
  date: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
};

export type DiaryDayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
};

type DayAggregation = {
  date: string;
  planEntryIds: number[];
  fullReportPlanEntryIds: Set<number>;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
};

const isNonEmptyText = (value?: string | null) =>
  Boolean(value && value.trim().length > 0);

export const isValidDateString = (value: string | null) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const buildDateRange = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const dates: string[] = [];
  for (let cursor = new Date(start); cursor <= end; ) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

const buildDayStatus = (params: {
  date: string;
  planEntryIds: number[];
  fullReportPlanEntryIds: Set<number>;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
}): DiaryDayStatus => {
  const workoutsTotal = params.planEntryIds.length;
  const workoutsWithFullReport = params.planEntryIds.filter((id) =>
    params.fullReportPlanEntryIds.has(id)
  ).length;
  const dayHasReport =
    params.hasWeightMorning &&
    params.hasWeightEvening &&
    (workoutsTotal === 0 || workoutsWithFullReport === workoutsTotal);
  return {
    date: params.date,
    hasWeightMorning: params.hasWeightMorning,
    hasWeightEvening: params.hasWeightEvening,
    workoutsTotal,
    workoutsWithFullReport,
    dayHasReport,
  };
};

export const getDiaryDayData = async (params: {
  userId: number;
  date: string;
}) => {
  const planEntriesRows = await db
    .select({
      id: planEntries.id,
      date: planEntries.date,
      sessionOrder: planEntries.sessionOrder,
      taskText: planEntries.taskText,
      commentText: planEntries.commentText,
      isWorkload: planEntries.isWorkload,
    })
    .from(planEntries)
    .where(and(eq(planEntries.userId, params.userId), eq(planEntries.date, params.date)))
    .orderBy(asc(planEntries.sessionOrder));

  const weightEntriesRows = await db
    .select({
      id: weightEntries.id,
      date: weightEntries.date,
      period: weightEntries.period,
      weightKg: weightEntries.weightKg,
    })
    .from(weightEntries)
    .where(
      and(eq(weightEntries.userId, params.userId), eq(weightEntries.date, params.date))
    );

  const [recoveryEntry] = await db
    .select({
      id: recoveryEntries.id,
      date: recoveryEntries.date,
      hasBath: recoveryEntries.hasBath,
      hasMfr: recoveryEntries.hasMfr,
      hasMassage: recoveryEntries.hasMassage,
    })
    .from(recoveryEntries)
    .where(
      and(
        eq(recoveryEntries.userId, params.userId),
        eq(recoveryEntries.date, params.date)
      )
    );

  const planEntryIds = planEntriesRows.map((entry) => entry.id);
  const workoutReportsRows = planEntryIds.length
    ? await db
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
            inArray(workoutReports.planEntryId, planEntryIds)
          )
        )
    : [];

  const hasWeightMorning = weightEntriesRows.some(
    (entry) => entry.period === "morning"
  );
  const hasWeightEvening = weightEntriesRows.some(
    (entry) => entry.period === "evening"
  );
  const fullReportPlanEntryIds = new Set<number>();
  for (const report of workoutReportsRows) {
    if (isNonEmptyText(report.resultText) && isNonEmptyText(report.commentText)) {
      fullReportPlanEntryIds.add(report.planEntryId);
    }
  }
  const status = buildDayStatus({
    date: params.date,
    planEntryIds,
    fullReportPlanEntryIds,
    hasWeightMorning,
    hasWeightEvening,
  });

  const fallbackRecoveryEntry: DiaryRecoveryEntry = {
    date: params.date,
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
  };

  return {
    planEntries: planEntriesRows as DiaryPlanEntry[],
    weightEntries: weightEntriesRows as DiaryWeightEntry[],
    workoutReports: workoutReportsRows as DiaryWorkoutReport[],
    recoveryEntry: recoveryEntry ?? fallbackRecoveryEntry,
    status,
  };
};

export const getDiaryDaysInRange = async (params: {
  userId: number;
  from: string;
  to: string;
  includeEmpty?: boolean;
}): Promise<DiaryDayStatus[]> => {
  const planRows = await db
    .select({
      id: planEntries.id,
      date: planEntries.date,
    })
    .from(planEntries)
    .where(
      and(
        eq(planEntries.userId, params.userId),
        gte(planEntries.date, params.from),
        lte(planEntries.date, params.to)
      )
    );

  const weightRows = await db
    .select({
      date: weightEntries.date,
      period: weightEntries.period,
    })
    .from(weightEntries)
    .where(
      and(
        eq(weightEntries.userId, params.userId),
        gte(weightEntries.date, params.from),
        lte(weightEntries.date, params.to)
      )
    );

  const planEntryIds = planRows.map((entry) => entry.id);
  const reportRows = planEntryIds.length
    ? await db
        .select({
          planEntryId: workoutReports.planEntryId,
          resultText: workoutReports.resultText,
          commentText: workoutReports.commentText,
        })
        .from(workoutReports)
        .where(
          and(
            eq(workoutReports.userId, params.userId),
            inArray(workoutReports.planEntryId, planEntryIds)
          )
        )
    : [];

  const dayMap = new Map<string, DayAggregation>();
  const planEntryDateMap = new Map<number, string>();

  for (const entry of planRows) {
    planEntryDateMap.set(entry.id, entry.date);
    const existing = dayMap.get(entry.date);
    if (existing) {
      existing.planEntryIds.push(entry.id);
    } else {
      dayMap.set(entry.date, {
        date: entry.date,
        planEntryIds: [entry.id],
        fullReportPlanEntryIds: new Set<number>(),
        hasWeightMorning: false,
        hasWeightEvening: false,
      });
    }
  }

  for (const entry of weightRows) {
    const existing = dayMap.get(entry.date);
    const target =
      existing ??
      ({
        date: entry.date,
        planEntryIds: [],
        fullReportPlanEntryIds: new Set<number>(),
        hasWeightMorning: false,
        hasWeightEvening: false,
      } as DayAggregation);
    if (entry.period === "morning") target.hasWeightMorning = true;
    if (entry.period === "evening") target.hasWeightEvening = true;
    if (!existing) {
      dayMap.set(entry.date, target);
    }
  }

  for (const report of reportRows) {
    if (!isNonEmptyText(report.resultText) || !isNonEmptyText(report.commentText)) {
      continue;
    }
    const entryDate = planEntryDateMap.get(report.planEntryId);
    if (!entryDate) continue;
    const day = dayMap.get(entryDate);
    if (!day) continue;
    day.fullReportPlanEntryIds.add(report.planEntryId);
  }

  if (params.includeEmpty) {
    for (const date of buildDateRange(params.from, params.to)) {
      if (!dayMap.has(date)) {
        dayMap.set(date, {
          date,
          planEntryIds: [],
          fullReportPlanEntryIds: new Set<number>(),
          hasWeightMorning: false,
          hasWeightEvening: false,
        });
      }
    }
  }

  return Array.from(dayMap.values())
    .map((day) =>
      buildDayStatus({
        date: day.date,
        planEntryIds: day.planEntryIds,
        fullReportPlanEntryIds: day.fullReportPlanEntryIds,
        hasWeightMorning: day.hasWeightMorning,
        hasWeightEvening: day.hasWeightEvening,
      })
    )
    .sort((a, b) => a.date.localeCompare(b.date));
};
