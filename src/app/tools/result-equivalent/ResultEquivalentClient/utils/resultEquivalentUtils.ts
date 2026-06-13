import { RIEGEL_EXPONENT } from "../constants/resultEquivalentConstants";
import type { PredictionMethod } from "../types/resultEquivalentTypes";

const DANIELS_MIN_SECONDS = 60;
const DANIELS_MAX_SECONDS = 24 * 60 * 60;
const DANIELS_ITERATIONS = 80;

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

export const normalizeDistanceInputValue = (value: string) => {
  if (value.length === 0) {
    return "";
  }

  return String(toNonNegativeInt(value));
};

export const parseTimeInputToSeconds = (value: string) => {
  if (value.length === 0) {
    return 0;
  }

  const parts = value.split(":");
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds += Number(parts[0]) * 3600;
    totalSeconds += Number(parts[1]) * 60;
    totalSeconds += Number(parts[2]);
  } else if (parts.length === 2) {
    totalSeconds += Number(parts[0]) * 60;
    totalSeconds += Number(parts[1]);
  } else if (parts.length === 1) {
    totalSeconds += Number(parts[0]);
  }

  if (!Number.isFinite(totalSeconds)) {
    return 0;
  }

  if (totalSeconds <= 0) {
    return 0;
  }

  return totalSeconds;
};

export const calculateRiegelEquivalentSeconds = (
  sourceSeconds: number,
  sourceDistance: number,
  targetDistance: number
) => {
  if (!Number.isFinite(sourceSeconds) || !Number.isFinite(sourceDistance)) {
    return 0;
  }

  if (!Number.isFinite(targetDistance)) {
    return 0;
  }

  if (sourceSeconds <= 0 || sourceDistance <= 0 || targetDistance <= 0) {
    return 0;
  }

  return Math.round(sourceSeconds * (targetDistance / sourceDistance) ** RIEGEL_EXPONENT);
};

export const calculateCameronEquivalentSeconds = (
  sourceSeconds: number,
  sourceDistance: number,
  targetDistance: number
) => {
  if (!Number.isFinite(sourceSeconds) || !Number.isFinite(sourceDistance)) {
    return 0;
  }

  if (!Number.isFinite(targetDistance)) {
    return 0;
  }

  if (sourceSeconds <= 0 || sourceDistance <= 0 || targetDistance <= 0) {
    return 0;
  }

  const getCameronFactor = (distanceMeters: number) => {
    return 13.49681 - 0.000030363 * distanceMeters + 835.7114 / distanceMeters ** 0.7905;
  };

  const sourceFactor = getCameronFactor(sourceDistance);
  const targetFactor = getCameronFactor(targetDistance);

  if (targetFactor <= 0) {
    return 0;
  }

  return Math.round(
    (sourceSeconds / sourceDistance) * targetDistance * (sourceFactor / targetFactor)
  );
};

export const calculateDanielsVdot = (distanceMeters: number, totalSeconds: number) => {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(totalSeconds)) {
    return 0;
  }

  if (distanceMeters <= 0 || totalSeconds <= 0) {
    return 0;
  }

  const totalMinutes = totalSeconds / 60;
  const velocityMetersPerMinute = distanceMeters / totalMinutes;
  const oxygenCost =
    -4.6 + 0.182258 * velocityMetersPerMinute + 0.000104 * velocityMetersPerMinute ** 2;
  const oxygenFraction =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * totalMinutes) +
    0.2989558 * Math.exp(-0.1932605 * totalMinutes);

  if (oxygenFraction <= 0) {
    return 0;
  }

  return oxygenCost / oxygenFraction;
};

export const calculateDanielsEquivalentSeconds = (
  sourceSeconds: number,
  sourceDistance: number,
  targetDistance: number
) => {
  const sourceVdot = calculateDanielsVdot(sourceDistance, sourceSeconds);

  if (sourceVdot <= 0 || targetDistance <= 0) {
    return 0;
  }

  let lowSeconds = DANIELS_MIN_SECONDS;
  let highSeconds = DANIELS_MAX_SECONDS;

  for (let index = 0; index < DANIELS_ITERATIONS; index += 1) {
    const midSeconds = (lowSeconds + highSeconds) / 2;
    const midVdot = calculateDanielsVdot(targetDistance, midSeconds);

    if (midVdot > sourceVdot) {
      lowSeconds = midSeconds;
    } else {
      highSeconds = midSeconds;
    }
  }

  return Math.round(highSeconds);
};

export const calculateEquivalentSeconds = (
  method: PredictionMethod,
  sourceSeconds: number,
  sourceDistance: number,
  targetDistance: number
) => {
  if (method === "cameron") {
    return calculateCameronEquivalentSeconds(sourceSeconds, sourceDistance, targetDistance);
  }

  if (method === "daniels") {
    return calculateDanielsEquivalentSeconds(sourceSeconds, sourceDistance, targetDistance);
  }

  return calculateRiegelEquivalentSeconds(sourceSeconds, sourceDistance, targetDistance);
};

export const formatTime = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds)) {
    return "00:00:00";
  }

  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
};

export const formatPace = (totalSeconds: number, distanceMeters: number) => {
  if (!Number.isFinite(totalSeconds) || !Number.isFinite(distanceMeters)) {
    return "00:00 /км";
  }

  if (totalSeconds <= 0 || distanceMeters <= 0) {
    return "00:00 /км";
  }

  const paceSeconds = Math.round(totalSeconds / (distanceMeters / 1000));
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} /км`;
};

export const formatDistanceLabel = (distanceMeters: number) => {
  return `${distanceMeters.toLocaleString("ru-RU")} м`;
};
