import type { ClubRecord } from "@/lib/personalRecords";
import type { PersonalRecordDistanceKey } from "@/lib/personalRecords.constants";

export type ResultsDistanceKey = "5k" | "10k" | "21k" | "42k";
export type ResultsGender = "male" | "female";

export type ResultsEntry = {
  id: number;
  distanceKey: ResultsDistanceKey;
  athlete: string;
  gender: ResultsGender | null;
  timeText: string;
  timeSeconds: number;
  recordDate: string;
  raceName: string | null;
  raceCity: string | null;
  protocolUrl: string | null;
};

const formatAthleteName = (name: string, lastName: string | null) => {
  const trimmedName = name.trim();
  const trimmedLastName = (lastName ?? "").trim();
  if (!trimmedName) {
    return trimmedLastName;
  }
  if (!trimmedLastName) {
    return trimmedName;
  }
  return `${trimmedName} ${trimmedLastName}`;
};

const normalizeGender = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "male") {
    return "male";
  }
  if (normalized === "female") {
    return "female";
  }
  return null;
};

const mapDistanceKey = (key: PersonalRecordDistanceKey): ResultsDistanceKey | null => {
  if (key === "5k") {
    return "5k";
  }
  if (key === "10k") {
    return "10k";
  }
  if (key === "21_1k") {
    return "21k";
  }
  if (key === "marathon") {
    return "42k";
  }
  return null;
};

const parseTimeTextSeconds = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const timeParts = trimmed.split(":");
  if (timeParts.length !== 3) {
    return null;
  }
  const hoursValue = Number.parseInt(timeParts[0], 10);
  if (!Number.isFinite(hoursValue)) {
    return null;
  }
  const minutesValue = Number.parseInt(timeParts[1], 10);
  if (!Number.isFinite(minutesValue)) {
    return null;
  }
  const secondsPart = timeParts[2];
  const secondsParts = secondsPart.split(".");
  if (secondsParts.length > 2) {
    return null;
  }
  const secondsValue = Number.parseInt(secondsParts[0], 10);
  if (!Number.isFinite(secondsValue)) {
    return null;
  }
  let fractionValue = 0;
  if (secondsParts.length === 2) {
    const fractionText = secondsParts[1];
    if (!fractionText) {
      return null;
    }
    const parsedFraction = Number(`0.${fractionText}`);
    if (!Number.isFinite(parsedFraction)) {
      return null;
    }
    fractionValue = parsedFraction;
  }
  return hoursValue * 3600 + minutesValue * 60 + secondsValue + fractionValue;
};

export const mapClubRecordsToResults = (records: ClubRecord[]): ResultsEntry[] => {
  const results: ResultsEntry[] = [];
  for (const record of records) {
    const distanceKey = mapDistanceKey(record.distanceKey);
    if (!distanceKey) {
      continue;
    }
    const timeSeconds = parseTimeTextSeconds(record.timeText);
    if (timeSeconds === null) {
      continue;
    }
    results.push({
      id: record.id,
      distanceKey,
      athlete: formatAthleteName(record.userName, record.userLastName),
      gender: normalizeGender(record.userGender),
      timeText: record.timeText,
      timeSeconds,
      recordDate: record.recordDate,
      raceName: record.raceName,
      raceCity: record.raceCity,
      protocolUrl: record.protocolUrl,
    });
  }
  return results;
};

export const groupResultsByDistance = (records: ResultsEntry[]) => {
  const grouped: Record<ResultsDistanceKey, ResultsEntry[]> = {
    "5k": [],
    "10k": [],
    "21k": [],
    "42k": [],
  };
  for (const record of records) {
    grouped[record.distanceKey].push(record);
  }
  return grouped;
};
