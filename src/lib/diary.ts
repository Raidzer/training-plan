import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  planEntries,
  recoveryEntries,
  shoes,
  weightEntries,
  workoutReportConditions,
  workoutReportShoes,
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
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  weather: string | null;
  hasWind: boolean | null;
  temperatureC: string | null;
  surface: string | null;
  shoes: { id: number; name: string }[];
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
  hasWorkload: boolean;
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

const isNonEmptyText = (value?: string | null) => Boolean(value && value.trim().length > 0);

const parseDistanceKm = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
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

const shiftDate = (value: string, deltaDays: number) => {
  const base = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toISOString().slice(0, 10);
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

export const getDiaryDayData = async (params: { userId: number; date: string }) => {
  const previousDate = shiftDate(params.date, -1);
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
    .where(and(eq(weightEntries.userId, params.userId), eq(weightEntries.date, params.date)));

  const [previousEveningWeight] = previousDate
    ? await db
        .select({ weightKg: weightEntries.weightKg })
        .from(weightEntries)
        .where(
          and(
            eq(weightEntries.userId, params.userId),
            eq(weightEntries.date, previousDate),
            eq(weightEntries.period, "evening")
          )
        )
    : [];

  const [recoveryEntry] = await db
    .select({
      id: recoveryEntries.id,
      date: recoveryEntries.date,
      hasBath: recoveryEntries.hasBath,
      hasMfr: recoveryEntries.hasMfr,
      hasMassage: recoveryEntries.hasMassage,
      sleepHours: recoveryEntries.sleepHours,
    })
    .from(recoveryEntries)
    .where(and(eq(recoveryEntries.userId, params.userId), eq(recoveryEntries.date, params.date)));

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
            inArray(workoutReports.planEntryId, planEntryIds)
          )
        )
    : [];

  const reportIds = workoutReportsRows.map((report) => report.id);
  const reportShoesRows =
    reportIds.length > 0
      ? await db
          .select({
            reportId: workoutReportShoes.workoutReportId,
            shoeId: workoutReportShoes.shoeId,
            shoeName: shoes.name,
          })
          .from(workoutReportShoes)
          .innerJoin(shoes, eq(shoes.id, workoutReportShoes.shoeId))
          .where(inArray(workoutReportShoes.workoutReportId, reportIds))
      : [];
  const reportShoesMap = new Map<number, { id: number; name: string }[]>();
  for (const row of reportShoesRows) {
    const existing = reportShoesMap.get(row.reportId);
    const item = { id: row.shoeId, name: row.shoeName };
    if (!existing) {
      reportShoesMap.set(row.reportId, [item]);
    } else {
      existing.push(item);
    }
  }
  const workoutReportsWithShoes = workoutReportsRows.map((report) => ({
    ...report,
    shoes: reportShoesMap.get(report.id) ?? [],
  }));

  const hasWeightMorning = weightEntriesRows.some((entry) => entry.period === "morning");
  const hasWeightEvening = weightEntriesRows.some((entry) => entry.period === "evening");
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
    workoutReports: workoutReportsWithShoes as DiaryWorkoutReport[],
    recoveryEntry: recoveryEntry ?? fallbackRecoveryEntry,
    status,
    previousEveningWeightKg: previousEveningWeight ? String(previousEveningWeight.weightKg) : null,
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
    if (entry.period === "morning") {
      target.hasWeightMorning = true;
    }
    if (entry.period === "evening") {
      target.hasWeightEvening = true;
    }
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
    if (!entryDate) {
      continue;
    }
    const day = dayMap.get(entryDate);
    if (!day) {
      continue;
    }
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
      isWorkload: planEntries.isWorkload,
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
          id: workoutReports.id,
          planEntryId: workoutReports.planEntryId,
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
            inArray(workoutReports.planEntryId, planEntryIds)
          )
        )
    : [];

  const reportIds = reportRows.map((report) => report.id);
  const reportShoesRows =
    reportIds.length > 0
      ? await db
          .select({
            reportId: workoutReportShoes.workoutReportId,
            shoeId: workoutReportShoes.shoeId,
            shoeName: shoes.name,
          })
          .from(workoutReportShoes)
          .innerJoin(shoes, eq(shoes.id, workoutReportShoes.shoeId))
          .where(inArray(workoutReportShoes.workoutReportId, reportIds))
      : [];
  const reportShoesMap = new Map<number, { id: number; name: string }[]>();
  for (const row of reportShoesRows) {
    const existing = reportShoesMap.get(row.reportId);
    const item = { id: row.shoeId, name: row.shoeName };
    if (!existing) {
      reportShoesMap.set(row.reportId, [item]);
    } else {
      existing.push(item);
    }
  }

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

  const planByDate = new Map<string, { id: number; taskText: string; isWorkload: boolean }[]>();
  for (const entry of planRows) {
    const existing = planByDate.get(entry.date) ?? [];
    existing.push({
      id: entry.id,
      taskText: entry.taskText,
      isWorkload: entry.isWorkload,
    });
    planByDate.set(entry.date, existing);
  }

  const reportByPlan = new Map<
    number,
    {
      id: number;
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
      shoes: { id: number; name: string }[];
    }
  >();
  for (const report of reportRows) {
    reportByPlan.set(report.planEntryId, {
      ...report,
      shoes: reportShoesMap.get(report.id) ?? [],
    });
  }

  const weightByDate = new Map<string, { morning?: string; evening?: string }>();
  for (const entry of weightRows) {
    const target = weightByDate.get(entry.date) ?? {};
    if (entry.period === "morning") {
      target.morning = String(entry.weightKg);
    }
    if (entry.period === "evening") {
      target.evening = String(entry.weightKg);
    }
    weightByDate.set(entry.date, target);
  }

  const recoveryByDate = new Map<
    string,
    {
      hasBath: boolean;
      hasMfr: boolean;
      hasMassage: boolean;
      sleepHours: string | null;
    }
  >();
  for (const entry of recoveryRows) {
    recoveryByDate.set(entry.date, {
      hasBath: entry.hasBath,
      hasMfr: entry.hasMfr,
      hasMassage: entry.hasMassage,
      sleepHours: entry.sleepHours ? String(entry.sleepHours) : null,
    });
  }

  const formatWorkoutScore = (report?: {
    overallScore: number | null;
    functionalScore: number | null;
    muscleScore: number | null;
  }) => {
    if (!report) {
      return "-";
    }
    const parts = [
      report.overallScore ?? "-",
      report.functionalScore ?? "-",
      report.muscleScore ?? "-",
    ];
    if (parts.every((value) => value === "-")) {
      return "-";
    }
    return parts.join("-");
  };

  const formatSleep = (entry?: { sleepHours: string | null }) => {
    if (!entry?.sleepHours) {
      return "-";
    }
    const parsed = Number(entry.sleepHours);
    if (!Number.isFinite(parsed)) {
      return "-";
    }
    const clamped = Math.min(Math.max(parsed, 0), 24);
    let hours = Math.floor(clamped);
    let minutes = Math.round((clamped - hours) * 60);
    if (minutes === 60) {
      hours = Math.min(hours + 1, 24);
      minutes = 0;
    }
    if (hours === 24) {
      minutes = 0;
    }
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const formatWeightValue = (value?: string) => {
    if (!value) {
      return "-";
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return value;
    }
    return (Math.round(parsed * 10) / 10).toFixed(1);
  };

  const formatWeight = (entry?: { morning?: string; evening?: string }) => {
    if (!entry?.morning && !entry?.evening) {
      return "-";
    }
    const morning = formatWeightValue(entry.morning);
    const evening = formatWeightValue(entry.evening);
    return `${morning} / ${evening}`;
  };

  const formatNumberedLines = (values: Array<string | null | undefined>, emptyValue = "-") => {
    if (!values.length) {
      return emptyValue;
    }
    const normalized = values.map((value) => {
      if (value === null || value === undefined) {
        return emptyValue;
      }
      const trimmed = String(value).trim();
      return trimmed.length > 0 ? trimmed : emptyValue;
    });
    if (normalized.length === 1) {
      return normalized[0];
    }
    return normalized.map((value, index) => `${index + 1}) ${value}`).join("\n");
  };

  const formatRecovery = (entry?: { hasBath: boolean; hasMfr: boolean; hasMassage: boolean }) => {
    if (!entry) {
      return "-";
    }
    const flags = [
      entry.hasBath ? "Баня" : null,
      entry.hasMfr ? "МФР" : null,
      entry.hasMassage ? "Массаж" : null,
    ].filter(Boolean);
    return flags.length ? flags.join(", ") : "-";
  };

  const weatherLabels: Record<string, string> = {
    cloudy: "Пасмурно",
    sunny: "Солнечно",
    rain: "Дождь",
    snow: "Снег",
  };

  const surfaceLabels: Record<string, string> = {
    ground: "Грунт",
    asphalt: "Асфальт",
    manezh: "Манеж",
    treadmill: "Беговая дорожка",
    stadium: "Стадион",
  };

  const formatTemperatureValue = (value?: string | null) => {
    if (value === null || value === undefined) {
      return "";
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
      return "";
    }
    const parsed = Number(trimmed);
    const temperatureText = Number.isFinite(parsed)
      ? (Math.round(parsed * 10) / 10).toFixed(1)
      : trimmed;
    return `${temperatureText}°C`;
  };

  const rows: DiaryExportRow[] = [];
  for (const date of buildDateRange(params.from, params.to)) {
    const dayEntries = planByDate.get(date) ?? [];
    const recovery = recoveryByDate.get(date);
    const weight = weightByDate.get(date);
    const sleepText = formatSleep(recovery);
    const weightText = formatWeight(weight);
    const recoveryText = formatRecovery(recovery);
    const hasWorkload = dayEntries.some((entry) => entry.isWorkload);

    if (dayEntries.length === 0) {
      rows.push({
        dateTime: date,
        task: "-",
        result: "-",
        comment: "-",
        score: "-",
        sleep: sleepText,
        weight: weightText,
        recovery: recoveryText,
        volume: "-",
        hasWorkload: false,
      });
      continue;
    }

    const tasks: string[] = [];
    const results: string[] = [];
    const comments: string[] = [];
    const scores: string[] = [];
    const startTimes: string[] = [];
    let totalDistanceKm = 0;

    for (const entry of dayEntries) {
      const report = reportByPlan.get(entry.id);
      if (report?.startTime) {
        startTimes.push(report.startTime);
      }
      const taskText = entry.taskText?.trim() ? entry.taskText : "-";
      const resultText = report?.resultText?.trim() ? report.resultText : "-";
      const commentParts: string[] = [];
      if (report?.commentText?.trim()) {
        commentParts.push(report.commentText.trim());
      }
      const temperatureText = formatTemperatureValue(report?.temperatureC);
      if (temperatureText) {
        commentParts.push(temperatureText);
      }
      const weatherText = report?.weather ? (weatherLabels[report.weather] ?? "") : "";
      if (weatherText) {
        commentParts.push(weatherText);
      }
      if (report?.hasWind) {
        commentParts.push("ветер");
      }
      const surfaceText = report?.surface ? (surfaceLabels[report.surface] ?? "") : "";
      if (surfaceText) {
        commentParts.push(surfaceText);
      }
      const shoeText =
        report?.shoes && report.shoes.length > 0
          ? report.shoes.map((shoe) => shoe.name).join(", ")
          : "";
      if (shoeText) {
        commentParts.push(shoeText);
      }
      const commentText = commentParts.length ? commentParts.join(". ") : "-";
      tasks.push(taskText);
      results.push(resultText);
      comments.push(commentText);
      scores.push(formatWorkoutScore(report));
      totalDistanceKm += parseDistanceKm(report?.distanceKm ?? null);
    }

    const taskText = formatNumberedLines(tasks);
    const resultText = formatNumberedLines(results);
    const commentText = formatNumberedLines(comments);
    const scoreText = formatNumberedLines(scores);
    const dateTime = startTimes.length ? `${date} ${startTimes.join(", ")}` : date;
    const volumeText = totalDistanceKm > 0 ? totalDistanceKm.toFixed(2) : "-";

    rows.push({
      dateTime,
      task: taskText,
      result: resultText,
      comment: commentText,
      score: scoreText,
      sleep: sleepText,
      weight: weightText,
      recovery: recoveryText,
      volume: volumeText,
      hasWorkload,
    });
  }

  return rows;
};
