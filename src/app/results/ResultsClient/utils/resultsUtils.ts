import type { ClubRecord } from "@/server/personalRecords";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";
import { RESULTS_LABELS, RESULTS_TIME_EPSILON } from "../constants/resultsConstants";
import type {
  ResultsDistanceKey,
  ResultsEntry,
  ResultsGender,
  SplitResults,
} from "../types/resultsTypes";

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

const normalizeGender = (value: string): ResultsGender | null => {
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

export const formatResultDate = (value: string) => {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
};

export const buildMetaItems = (item: ResultsEntry) => {
  const meta: string[] = [];

  if (item.raceName) {
    meta.push(item.raceName);
  }

  if (item.raceCity) {
    meta.push(item.raceCity);
  }

  if (item.recordDate) {
    meta.push(formatResultDate(item.recordDate));
  }

  return meta;
};

export const formatResultsCount = (count: number) => {
  const absoluteCount = Math.abs(count);
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;
  let suffix: string = RESULTS_LABELS.resultCountMany;

  if (lastTwoDigits < 11 || lastTwoDigits > 14) {
    if (lastDigit === 1) {
      suffix = RESULTS_LABELS.resultCountOne;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      suffix = RESULTS_LABELS.resultCountFew;
    }
  }

  return `${count} ${suffix}`;
};

export const sortResults = (items: ResultsEntry[]) =>
  [...items].sort((left, right) => {
    if (left.timeSeconds !== right.timeSeconds) {
      return left.timeSeconds - right.timeSeconds;
    }

    if (left.recordDate !== right.recordDate) {
      return left.recordDate.localeCompare(right.recordDate);
    }

    if (left.athlete !== right.athlete) {
      return left.athlete.localeCompare(right.athlete, "ru");
    }

    return left.id - right.id;
  });

export const splitRecords = (items: ResultsEntry[]): SplitResults => {
  if (items.length === 0) {
    return { records: [], rest: [] };
  }

  const bestTime = items[0].timeSeconds;
  const records = items.filter(
    (item) => Math.abs(item.timeSeconds - bestTime) <= RESULTS_TIME_EPSILON
  );
  const rest = items.filter((item) => Math.abs(item.timeSeconds - bestTime) > RESULTS_TIME_EPSILON);

  return { records, rest };
};
