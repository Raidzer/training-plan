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

export const isNonEmptyText = (value?: string | null) => Boolean(value && value.trim().length > 0);

export const parseDistanceKm = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isValidDateString = (value: string | null) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export const buildDateRange = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const dates: string[] = [];
  for (let cursor = new Date(start); cursor <= end; ) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

export const shiftDate = (value: string, deltaDays: number) => {
  const base = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toISOString().slice(0, 10);
};

export const buildDayStatus = (params: {
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

export const weatherLabels: Record<string, string> = {
  cloudy: "Пасмурно",
  sunny: "Солнечно",
  rain: "Дождь",
  snow: "Снег",
};

export const surfaceLabels: Record<string, string> = {
  ground: "Грунт",
  asphalt: "Асфальт",
  manezh: "Манеж",
  treadmill: "Беговая дорожка",
  stadium: "Стадион",
};

export const formatTemperatureValue = (value?: string | null) => {
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

export const formatDateWithDay = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const dayOfWeek = weekDays[date.getDay()];
  return `${day}.${month}.${year}(${dayOfWeek})`;
};

export const formatWorkoutScore = (report?: {
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

export const formatSleep = (entry?: { sleepHours: string | null }) => {
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

export const formatWeightValue = (value?: string) => {
  if (!value) {
    return "-";
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return (Math.round(parsed * 10) / 10).toFixed(1);
};

export const formatWeight = (entry?: { morning?: string; evening?: string }) => {
  if (!entry?.morning && !entry?.evening) {
    return "-";
  }
  const morning = formatWeightValue(entry.morning);
  const evening = formatWeightValue(entry.evening);
  return `${morning} / ${evening}`;
};

export const formatNumberedLines = (values: Array<string | null | undefined>, emptyValue = "-") => {
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

export const formatRecovery = (entry?: {
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
}) => {
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
