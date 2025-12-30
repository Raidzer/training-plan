import dayjs, { type Dayjs } from "dayjs";
import type {
  RecoveryEntry,
  WorkoutFormEntry,
  WorkoutReport,
} from "../types/diaryTypes";

export const formatDate = (value: Dayjs) => value.format("YYYY-MM-DD");

export const parseDate = (value: string) => dayjs(value, "YYYY-MM-DD", true);

export const isValidDateString = (value?: string | null) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export const getMonthRange = (value: Dayjs) => ({
  from: value.startOf("month").format("YYYY-MM-DD"),
  to: value.endOf("month").format("YYYY-MM-DD"),
});

export const toDefaultWorkoutForm = (
  report?: WorkoutReport | null
): WorkoutFormEntry => ({
  startTime: report?.startTime ?? "",
  resultText: report?.resultText ?? "",
  commentText: report?.commentText ?? "",
  distanceKm: report?.distanceKm ?? "",
});

export const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value?: string | null) =>
  value && value.trim().length > 0 ? value.trim() : "";

export const normalizeStartTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  if (digits.length === 3) {
    const firstTwo = Number(digits.slice(0, 2));
    const useSingleHour = Number.isFinite(firstTwo) && firstTwo > 23;
    const splitIndex = useSingleHour ? 1 : 2;
    const hours = digits.slice(0, splitIndex).padStart(2, "0");
    const minutes = digits.slice(splitIndex);
    return `${hours}:${minutes}`;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const TIME_INPUT_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const formatSleepTimeValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "";
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) return "";
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
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

export const parseSleepTimeInput = (value: string) => {
  const normalized = normalizeStartTimeInput(value);
  if (!normalized) {
    return { normalized, value: null, valid: true };
  }
  if (!TIME_INPUT_REGEX.test(normalized) && normalized !== "24:00") {
    return { normalized, value: null, valid: false };
  }
  const [hours, minutes] = normalized.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return { normalized, value: null, valid: false };
  }
  if (hours === 24 && minutes !== 0) {
    return { normalized, value: null, valid: false };
  }
  return { normalized, value: hours + minutes / 60, valid: true };
};

export const formatWeightValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "";
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) return "";
  return (Math.round(parsed * 10) / 10).toFixed(1);
};

export const joinValues = (values: Array<string | null | undefined>) => {
  if (!values.length) return "";
  const normalized = values
    .map(normalizeText)
    .filter((item) => item.length > 0);
  if (!normalized.length) return "";
  return normalized.join("; ");
};

export const formatScore = (entry?: RecoveryEntry | null) => {
  if (!entry) return "";
  const parts = [
    entry.overallScore,
    entry.functionalScore,
    entry.muscleScore,
  ].filter((value): value is number => value !== null && value !== undefined);
  if (!parts.length) return "";
  return parts.map(String).join("-");
};
