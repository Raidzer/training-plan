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
  distanceKm: string | null;
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
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  sleepHours: string | null;
};

export type DiaryDayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
  totalDistanceKm: number;
};

export type DiaryExportRow = {
  dateTime: string;
  task: string;
  result: string;
  comment: string;
  score: string;
  sleep: string;
  weight: string;
  recovery: string;
  volume: string;
};

type DayAggregation = {
  date: string;
  planEntryIds: number[];
  fullReportPlanEntryIds: Set<number>;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  totalDistanceKm: number;
};

const isNonEmptyText = (value?: string | null) =>
  Boolean(value && value.trim().length > 0);

const parseDistanceKm = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  totalDistanceKm: number;
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
    hasBath: params.hasBath,
    hasMfr: params.hasMfr,
    hasMassage: params.hasMassage,
    totalDistanceKm: params.totalDistanceKm,
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
      overallScore: recoveryEntries.overallScore,
      functionalScore: recoveryEntries.functionalScore,
      muscleScore: recoveryEntries.muscleScore,
      sleepHours: recoveryEntries.sleepHours,
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
          distanceKm: workoutReports.distanceKm,
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
  const hasBath = Boolean(recoveryEntry?.hasBath);
  const hasMfr = Boolean(recoveryEntry?.hasMfr);
  const hasMassage = Boolean(recoveryEntry?.hasMassage);
  const fullReportPlanEntryIds = new Set<number>();
  let totalDistanceKm = 0;
  for (const report of workoutReportsRows) {
    totalDistanceKm += parseDistanceKm(report.distanceKm);
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
    hasBath,
    hasMfr,
    hasMassage,
    totalDistanceKm,
  });

  const fallbackRecoveryEntry: DiaryRecoveryEntry = {
    date: params.date,
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: null,
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

  const recoveryRows = await db
    .select({
      date: recoveryEntries.date,
      hasBath: recoveryEntries.hasBath,
      hasMfr: recoveryEntries.hasMfr,
      hasMassage: recoveryEntries.hasMassage,
    })
    .from(recoveryEntries)
    .where(
      and(
        eq(recoveryEntries.userId, params.userId),
        gte(recoveryEntries.date, params.from),
        lte(recoveryEntries.date, params.to)
      )
    );

  const planEntryIds = planRows.map((entry) => entry.id);
  const reportRows = planEntryIds.length
    ? await db
        .select({
          planEntryId: workoutReports.planEntryId,
          resultText: workoutReports.resultText,
          commentText: workoutReports.commentText,
          distanceKm: workoutReports.distanceKm,
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
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        totalDistanceKm: 0,
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
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        totalDistanceKm: 0,
      } as DayAggregation);
    if (entry.period === "morning") target.hasWeightMorning = true;
    if (entry.period === "evening") target.hasWeightEvening = true;
    if (!existing) {
      dayMap.set(entry.date, target);
    }
  }

  for (const entry of recoveryRows) {
    const existing = dayMap.get(entry.date);
    const target =
      existing ??
      ({
        date: entry.date,
        planEntryIds: [],
        fullReportPlanEntryIds: new Set<number>(),
        hasWeightMorning: false,
        hasWeightEvening: false,
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        totalDistanceKm: 0,
      } as DayAggregation);
    target.hasBath = entry.hasBath;
    target.hasMfr = entry.hasMfr;
    target.hasMassage = entry.hasMassage;
    if (!existing) {
      dayMap.set(entry.date, target);
    }
  }

  for (const report of reportRows) {
    const entryDate = planEntryDateMap.get(report.planEntryId);
    if (!entryDate) continue;
    const day = dayMap.get(entryDate);
    if (!day) continue;
    day.totalDistanceKm += parseDistanceKm(report.distanceKm);
    if (!isNonEmptyText(report.resultText) || !isNonEmptyText(report.commentText)) {
      continue;
    }
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
          hasBath: false,
          hasMfr: false,
          hasMassage: false,
          totalDistanceKm: 0,
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
        hasBath: day.hasBath,
        hasMfr: day.hasMfr,
        hasMassage: day.hasMassage,
        totalDistanceKm: day.totalDistanceKm,
      })
    )
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getDiaryExportRows = async (params: {
  userId: number;
  from: string;
  to: string;
}): Promise<DiaryExportRow[]> => {
  const planRows = await db
    .select({
      id: planEntries.id,
      date: planEntries.date,
      sessionOrder: planEntries.sessionOrder,
      taskText: planEntries.taskText,
    })
    .from(planEntries)
    .where(
      and(
        eq(planEntries.userId, params.userId),
        gte(planEntries.date, params.from),
        lte(planEntries.date, params.to)
      )
    )
    .orderBy(asc(planEntries.date), asc(planEntries.sessionOrder));

  const planEntryIds = planRows.map((entry) => entry.id);
  const reportRows = planEntryIds.length
    ? await db
        .select({
          planEntryId: workoutReports.planEntryId,
          startTime: workoutReports.startTime,
          resultText: workoutReports.resultText,
          commentText: workoutReports.commentText,
          distanceKm: workoutReports.distanceKm,
        })
        .from(workoutReports)
        .where(
          and(
            eq(workoutReports.userId, params.userId),
            inArray(workoutReports.planEntryId, planEntryIds)
          )
        )
    : [];

  const weightRows = await db
    .select({
      date: weightEntries.date,
      period: weightEntries.period,
      weightKg: weightEntries.weightKg,
    })
    .from(weightEntries)
    .where(
      and(
        eq(weightEntries.userId, params.userId),
        gte(weightEntries.date, params.from),
        lte(weightEntries.date, params.to)
      )
    );

  const recoveryRows = await db
    .select({
      date: recoveryEntries.date,
      hasBath: recoveryEntries.hasBath,
      hasMfr: recoveryEntries.hasMfr,
      hasMassage: recoveryEntries.hasMassage,
      overallScore: recoveryEntries.overallScore,
      functionalScore: recoveryEntries.functionalScore,
      muscleScore: recoveryEntries.muscleScore,
      sleepHours: recoveryEntries.sleepHours,
    })
    .from(recoveryEntries)
    .where(
      and(
        eq(recoveryEntries.userId, params.userId),
        gte(recoveryEntries.date, params.from),
        lte(recoveryEntries.date, params.to)
      )
    );

  const planByDate = new Map<
    string,
    { id: number; taskText: string }[]
  >();
  for (const entry of planRows) {
    const existing = planByDate.get(entry.date) ?? [];
    existing.push({ id: entry.id, taskText: entry.taskText });
    planByDate.set(entry.date, existing);
  }

  const reportByPlan = new Map<
    number,
    {
      startTime: string;
      resultText: string;
      commentText: string | null;
      distanceKm: string | null;
    }
  >();
  for (const report of reportRows) {
    reportByPlan.set(report.planEntryId, report);
  }

  const weightByDate = new Map<string, { morning?: string; evening?: string }>();
  for (const entry of weightRows) {
    const target = weightByDate.get(entry.date) ?? {};
    if (entry.period === "morning") target.morning = String(entry.weightKg);
    if (entry.period === "evening") target.evening = String(entry.weightKg);
    weightByDate.set(entry.date, target);
  }

  const recoveryByDate = new Map<
    string,
    {
      hasBath: boolean;
      hasMfr: boolean;
      hasMassage: boolean;
      overallScore: number | null;
      functionalScore: number | null;
      muscleScore: number | null;
      sleepHours: string | null;
    }
  >();
  for (const entry of recoveryRows) {
    recoveryByDate.set(entry.date, {
      hasBath: entry.hasBath,
      hasMfr: entry.hasMfr,
      hasMassage: entry.hasMassage,
      overallScore: entry.overallScore ?? null,
      functionalScore: entry.functionalScore ?? null,
      muscleScore: entry.muscleScore ?? null,
      sleepHours: entry.sleepHours ? String(entry.sleepHours) : null,
    });
  }

  const formatScore = (entry?: {
    overallScore: number | null;
    functionalScore: number | null;
    muscleScore: number | null;
  }) => {
    if (!entry) return "-";
    const parts = [
      entry.overallScore ?? "-",
      entry.functionalScore ?? "-",
      entry.muscleScore ?? "-",
    ];
    if (parts.every((value) => value === "-")) return "-";
    return parts.join("-");
  };

  const formatSleep = (entry?: { sleepHours: string | null }) => {
    if (!entry?.sleepHours) return "-";
    return entry.sleepHours;
  };

  const formatWeight = (entry?: { morning?: string; evening?: string }) => {
    if (!entry?.morning && !entry?.evening) return "-";
    const morning = entry.morning ?? "-";
    const evening = entry.evening ?? "-";
    return `${morning} / ${evening}`;
  };

    const formatRecovery = (entry?: {
    hasBath: boolean;
    hasMfr: boolean;
    hasMassage: boolean;
  }) => {
    if (!entry) return "-";
    const flags = [
      entry.hasBath ? "Баня" : null,
      entry.hasMfr ? "МФР" : null,
      entry.hasMassage ? "Массаж" : null,
    ].filter(Boolean);
    return flags.length ? flags.join(", ") : "-";
  };

  const rows: DiaryExportRow[] = [];
  for (const date of buildDateRange(params.from, params.to)) {
    const dayEntries = planByDate.get(date) ?? [];
    const recovery = recoveryByDate.get(date);
    const weight = weightByDate.get(date);
    const scoreText = formatScore(recovery);
    const sleepText = formatSleep(recovery);
    const weightText = formatWeight(weight);
    const recoveryText = formatRecovery(recovery);

    if (dayEntries.length === 0) {
      rows.push({
        dateTime: date,
        task: "-",
        result: "-",
        comment: "-",
        score: scoreText,
        sleep: sleepText,
        weight: weightText,
        recovery: recoveryText,
        volume: "-",
      });
      continue;
    }

    const tasks: string[] = [];
    const results: string[] = [];
    const comments: string[] = [];
    const startTimes: string[] = [];
    let totalDistanceKm = 0;

    for (const entry of dayEntries) {
      const report = reportByPlan.get(entry.id);
      if (report?.startTime) startTimes.push(report.startTime);
      const taskText = entry.taskText?.trim() ? entry.taskText : "-";
      const resultText = report?.resultText?.trim()
        ? report.resultText
        : "-";
      const commentText = report?.commentText?.trim()
        ? report.commentText
        : "-";
      tasks.push(taskText);
      results.push(resultText);
      comments.push(commentText);
      totalDistanceKm += parseDistanceKm(report?.distanceKm ?? null);
    }

    const dateTime = startTimes.length
      ? `${date} ${startTimes.join(", ")}`
      : date;
    const volumeText = totalDistanceKm > 0 ? totalDistanceKm.toFixed(2) : "-";

    rows.push({
      dateTime,
      task: tasks.join("\n"),
      result: results.join("\n"),
      comment: comments.join("\n"),
      score: scoreText,
      sleep: sleepText,
      weight: weightText,
      recovery: recoveryText,
      volume: volumeText,
    });
  }

  return rows;
};
