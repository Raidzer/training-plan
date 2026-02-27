import { formatWorkoutScore, surfaceLabels, weatherLabels } from "@/shared/utils/diaryUtils";

type DailyReportPlanEntry = {
  id: number;
  taskText: string;
};

type DailyReportWorkoutReport = {
  planEntryId: number;
  startTime: string;
  resultText: string;
  commentText: string | null;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  weather: string | null;
  hasWind: boolean | null;
  temperatureC: string | null;
  surface: string | null;
  shoes: { id: number; name: string }[];
};

type DailyReportWeightEntry = {
  period: string;
  weightKg: string;
};

type DailyReportRecoveryEntry = {
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  sleepHours: string | null;
};

type DailyReportStatus = {
  totalDistanceKm: number;
};

export type DailyReportDayData = {
  planEntries: DailyReportPlanEntry[];
  workoutReports: DailyReportWorkoutReport[];
  weightEntries: DailyReportWeightEntry[];
  recoveryEntry: DailyReportRecoveryEntry;
  status: DailyReportStatus;
  previousEveningWeightKg: string | null;
};

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

const formatReportDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return value;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const dayLabel = WEEKDAYS[parsed.getUTCDay()] ?? "";
  return `${dayText}.${monthText}.${yearText}(${dayLabel})`;
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

const formatSleepTimeValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return "";
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

const formatWeightValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return (Math.round(parsed * 10) / 10).toFixed(1);
};

const joinValues = (values: Array<string | null | undefined>) => {
  const normalized = values
    .map((value) => (value && value.trim().length > 0 ? value.trim() : ""))
    .filter((value) => value.length > 0);
  return normalized.join("; ");
};

const formatRecoveryFlags = (entry: DailyReportRecoveryEntry) => {
  const flags = [
    entry.hasBath ? "Баня" : null,
    entry.hasMfr ? "МФР" : null,
    entry.hasMassage ? "Массаж" : null,
  ].filter(Boolean);
  return flags.length ? flags.join(", ") : "";
};

export const buildDailyReportText = (params: { date: string; day: DailyReportDayData | null }) => {
  if (!params.day) {
    return "";
  }

  const reportByPlan = new Map(
    params.day.workoutReports.map((report) => [report.planEntryId, report] as const)
  );
  const lines: string[] = [formatReportDate(params.date), ""];

  const pushWithSpacer = (value: string) => {
    lines.push(value);
    lines.push("");
  };

  for (const entry of params.day.planEntries) {
    const report = reportByPlan.get(entry.id);
    const taskText = entry.taskText?.trim() ? stripHtml(entry.taskText) : "-";
    const resultText = report?.resultText?.trim() ? report.resultText : "-";
    const commentParts: string[] = [];
    if (report?.commentText?.trim()) {
      commentParts.push(report.commentText.trim());
    }
    const temperatureText = formatTemperatureValue(report?.temperatureC);
    if (temperatureText) {
      commentParts.push(temperatureText);
    }
    const weatherText = report?.weather ? (weatherLabels[report.weather] ?? report.weather) : "";
    if (weatherText) {
      commentParts.push(weatherText);
    }
    if (report?.hasWind) {
      commentParts.push("Ветер");
    }
    const surfaceText = report?.surface ? (surfaceLabels[report.surface] ?? report.surface) : "";
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
    const scoreText = formatWorkoutScore(report);

    pushWithSpacer(taskText);
    if (report?.startTime?.trim()) {
      pushWithSpacer(report.startTime);
    }
    pushWithSpacer(resultText);
    pushWithSpacer(commentText);
    pushWithSpacer(scoreText);
  }

  const morningWeight = params.day.weightEntries.find(
    (entry) => entry.period === "morning"
  )?.weightKg;
  const sleepText = formatSleepTimeValue(params.day.recoveryEntry.sleepHours);
  const weightText = joinValues([
    formatWeightValue(params.day.previousEveningWeightKg),
    formatWeightValue(morningWeight),
  ]);
  const recoveryText = formatRecoveryFlags(params.day.recoveryEntry);
  const volumeKm =
    params.day.status.totalDistanceKm > 0 ? params.day.status.totalDistanceKm.toFixed(2) : "";

  const recoveryBlock = [
    sleepText || "-",
    weightText || "-",
    recoveryText || "",
    volumeKm ? `${volumeKm} км` : "-",
  ];

  for (const item of recoveryBlock) {
    if (!item) {
      continue;
    }
    pushWithSpacer(item);
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
};
