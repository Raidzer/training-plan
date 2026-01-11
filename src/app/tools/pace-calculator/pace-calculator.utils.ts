import type { SavedResult } from "./pace-calculator.types";

export const STORAGE_KEY = "pace-calculator:results";

export const toNonNegativeInt = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  if (parsed < 0) {
    return 0;
  }
  return parsed;
};

export const getCeilSeconds = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  return Math.ceil(value);
};

export const formatTime = (totalSeconds: number) => {
  const safeSeconds = getCeilSeconds(totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

export const formatMinutesSeconds = (totalSeconds: number) => {
  const safeSeconds = getCeilSeconds(totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const getDistanceLabel = (meters: number) => `${meters.toLocaleString("ru-RU")} м`;

export const parseTimeInputToSeconds = (value: string): number => {
  if (!value) return 0;
  const parts = value.split(":");
  let seconds = 0;
  if (parts.length === 3) {
    // HH:MM:SS
    seconds += Number(parts[0]) * 3600;
    seconds += Number(parts[1]) * 60;
    seconds += Number(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS
    seconds += Number(parts[0]) * 60;
    seconds += Number(parts[1]);
  } else if (parts.length === 1) {
    // SS (or just number)
    seconds += Number(parts[0]);
  }
  return seconds;
};

export const safeParseSaved = (raw: string | null): SavedResult[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }
      return (
        typeof item.id === "string" &&
        typeof item.distanceMeters === "number" &&
        typeof item.resultSeconds === "number" &&
        typeof item.paceSeconds === "number" &&
        typeof item.lapSeconds === "number" &&
        typeof item.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
};
