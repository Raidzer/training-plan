import dayjs, { type Dayjs } from "dayjs";
import type { PeriodRange } from "../types/periodTypes";

export const formatPeriodApiDate = (value: Dayjs) => value.format("YYYY-MM-DD");

export const formatPeriodDisplayDate = (value: string) => dayjs(value).format("DD.MM.YYYY");

export const createPeriodRange = (days: number): PeriodRange => [
  dayjs().subtract(days - 1, "day"),
  dayjs(),
];

export const formatWeightStatus = (hasWeightMorning: boolean, hasWeightEvening: boolean) =>
  `${hasWeightMorning ? "У" : "-"} / ${hasWeightEvening ? "В" : "-"}`;

export const formatRecoveryStatus = (hasBath: boolean, hasMfr: boolean, hasMassage: boolean) =>
  `${hasBath ? "Б" : "-"} / ${hasMfr ? "МФР" : "-"} / ${hasMassage ? "М" : "-"}`;

export const formatWorkoutStatus = (workoutsWithFullReport: number, workoutsTotal: number) =>
  `${workoutsWithFullReport}/${workoutsTotal}`;

export const formatDistanceValue = (distanceKm: number) => distanceKm.toFixed(2);

export const formatDistanceMetric = (distanceKm: number) => `${formatDistanceValue(distanceKm)} км`;

export const createPeriodExportFilename = (from: string, to: string) => `diary_${from}_${to}.xlsx`;

export const getFilenameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) {
    return null;
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? null;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
