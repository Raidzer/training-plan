import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  PERSONAL_RECORD_DISTANCES,
  PERSONAL_RECORD_TIME_REGEX,
  type PersonalRecordDistanceKey,
} from "@/shared/constants/personalRecords.constants";
import type { ApiRecord, RecordFieldErrors, RecordRow } from "../types/recordsTypes";

dayjs.extend(customParseFormat);

export const buildDefaultRows = (): RecordRow[] =>
  PERSONAL_RECORD_DISTANCES.map((distance) => ({
    distanceKey: distance.key,
    label: distance.label,
    timeText: "",
    recordDate: null,
    protocolUrl: "",
    raceName: "",
    raceCity: "",
  }));

export const normalizeTimeText = (value: string) => value.trim().replace(",", ".");

const PERSONAL_RECORD_DISTANCE_KEYS = new Set<string>(
  PERSONAL_RECORD_DISTANCES.map((distance) => distance.key)
);

const isNullableStringWithinLimit = (value: unknown, maxLength: number) =>
  value === null || (typeof value === "string" && value.length <= maxLength);

const isApiRecord = (value: unknown): value is ApiRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ApiRecord>;
  const normalizedTime =
    typeof record.timeText === "string" ? normalizeTimeText(record.timeText) : "";

  return (
    typeof record.distanceKey === "string" &&
    PERSONAL_RECORD_DISTANCE_KEYS.has(record.distanceKey) &&
    PERSONAL_RECORD_TIME_REGEX.test(normalizedTime) &&
    typeof record.recordDate === "string" &&
    dayjs(record.recordDate, "YYYY-MM-DD", true).isValid() &&
    isNullableStringWithinLimit(record.protocolUrl, MAX_PROTOCOL_URL_LENGTH) &&
    isNullableStringWithinLimit(record.raceName, MAX_RACE_NAME_LENGTH) &&
    isNullableStringWithinLimit(record.raceCity, MAX_RACE_CITY_LENGTH)
  );
};

export const getRecordsFromResponse = (data: unknown): ApiRecord[] | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const value = (data as { records?: unknown }).records;
  if (!Array.isArray(value)) {
    return null;
  }

  const records: ApiRecord[] = [];
  const seenDistanceKeys = new Set<string>();

  for (const record of value) {
    if (!isApiRecord(record) || seenDistanceKeys.has(record.distanceKey)) {
      return null;
    }

    seenDistanceKeys.add(record.distanceKey);
    records.push(record);
  }

  return records;
};

export const isRecordFilled = (row: RecordRow) => normalizeTimeText(row.timeText).length > 0;

export const hasRecordDraft = (row: RecordRow) =>
  isRecordFilled(row) ||
  row.recordDate !== null ||
  row.protocolUrl.trim().length > 0 ||
  row.raceName.trim().length > 0 ||
  row.raceCity.trim().length > 0;

export const getRecordsOverviewStats = (rows: RecordRow[]) => {
  let completedRecords = 0;
  let recordsWithProtocol = 0;

  for (const row of rows) {
    if (!isRecordFilled(row)) {
      continue;
    }

    completedRecords += 1;

    if (row.protocolUrl.trim()) {
      recordsWithProtocol += 1;
    }
  }

  return {
    totalDistances: rows.length,
    completedRecords,
    recordsWithProtocol,
  };
};

export const clearRecordRow = (row: RecordRow): RecordRow => ({
  ...row,
  timeText: "",
  recordDate: null,
  protocolUrl: "",
  raceName: "",
  raceCity: "",
});

export const getFirstInvalidDistanceKey = (
  rows: RecordRow[],
  errors: Record<string, RecordFieldErrors>
): PersonalRecordDistanceKey | null => {
  for (const row of rows) {
    if (errors[row.distanceKey]) {
      return row.distanceKey;
    }
  }

  return null;
};

export const clearChangedFieldErrors = (
  currentErrors: Record<string, RecordFieldErrors>,
  distanceKey: PersonalRecordDistanceKey,
  patch: Partial<RecordRow>
) => {
  const currentRowErrors = currentErrors[distanceKey];
  if (!currentRowErrors) {
    return currentErrors;
  }

  const nextRowErrors = { ...currentRowErrors };

  if ("timeText" in patch) {
    delete nextRowErrors.time;

    if (!normalizeTimeText(patch.timeText ?? "")) {
      delete nextRowErrors.date;
    }
  }

  if ("recordDate" in patch) {
    delete nextRowErrors.date;
  }

  if ("protocolUrl" in patch) {
    delete nextRowErrors.url;
  }

  if ("raceName" in patch) {
    delete nextRowErrors.raceName;
  }

  if ("raceCity" in patch) {
    delete nextRowErrors.raceCity;
  }

  const nextErrors = { ...currentErrors };

  if (Object.keys(nextRowErrors).length === 0) {
    delete nextErrors[distanceKey];
  } else {
    nextErrors[distanceKey] = nextRowErrors;
  }

  return nextErrors;
};

export const mapRecordsToRows = (records: ApiRecord[]): RecordRow[] => {
  const recordMap = new Map<string, ApiRecord>();

  for (const record of records) {
    if (!record || typeof record !== "object") {
      continue;
    }

    if (typeof record.distanceKey !== "string") {
      continue;
    }

    recordMap.set(record.distanceKey, record);
  }

  return PERSONAL_RECORD_DISTANCES.map((distance) => {
    const record = recordMap.get(distance.key);

    return {
      distanceKey: distance.key,
      label: distance.label,
      timeText: record?.timeText ? String(record.timeText) : "",
      recordDate: record?.recordDate ? dayjs(record.recordDate) : null,
      protocolUrl: record?.protocolUrl ? String(record.protocolUrl) : "",
      raceName: record?.raceName ? String(record.raceName) : "",
      raceCity: record?.raceCity ? String(record.raceCity) : "",
    };
  });
};

export const validateRows = (rows: RecordRow[]) => {
  const errors: Record<string, RecordFieldErrors> = {};
  let hasTimeError = false;
  let hasDateError = false;
  let hasUrlError = false;
  let hasRaceNameError = false;
  let hasRaceCityError = false;

  for (const row of rows) {
    const normalizedTime = normalizeTimeText(row.timeText);
    const protocolUrl = row.protocolUrl.trim();
    const raceName = row.raceName.trim();
    const raceCity = row.raceCity.trim();
    const rowErrors: RecordFieldErrors = {};

    if (!normalizedTime && hasRecordDraft(row)) {
      rowErrors.time = true;
      hasTimeError = true;
    }

    if (normalizedTime) {
      if (!PERSONAL_RECORD_TIME_REGEX.test(normalizedTime)) {
        rowErrors.time = true;
        hasTimeError = true;
      }

      if (!row.recordDate || !row.recordDate.isValid()) {
        rowErrors.date = true;
        hasDateError = true;
      }
    }

    if (protocolUrl && protocolUrl.length > MAX_PROTOCOL_URL_LENGTH) {
      rowErrors.url = true;
      hasUrlError = true;
    }

    if (raceName && raceName.length > MAX_RACE_NAME_LENGTH) {
      rowErrors.raceName = true;
      hasRaceNameError = true;
    }

    if (raceCity && raceCity.length > MAX_RACE_CITY_LENGTH) {
      rowErrors.raceCity = true;
      hasRaceCityError = true;
    }

    if (
      rowErrors.time ||
      rowErrors.date ||
      rowErrors.url ||
      rowErrors.raceName ||
      rowErrors.raceCity
    ) {
      errors[row.distanceKey] = rowErrors;
    }
  }

  return {
    errors,
    hasTimeError,
    hasDateError,
    hasUrlError,
    hasRaceNameError,
    hasRaceCityError,
  };
};

export const buildRecordsPayload = (rows: RecordRow[]) =>
  rows.map((row) => {
    const normalizedTime = normalizeTimeText(row.timeText);
    const recordDate = row.recordDate ? row.recordDate.format("YYYY-MM-DD") : "";
    const protocolUrl = row.protocolUrl.trim();
    const raceName = row.raceName.trim();
    const raceCity = row.raceCity.trim();

    return {
      distanceKey: row.distanceKey,
      timeText: normalizedTime,
      recordDate: normalizedTime ? recordDate || null : null,
      protocolUrl: normalizedTime ? protocolUrl || null : null,
      raceName: normalizedTime ? raceName || null : null,
      raceCity: normalizedTime ? raceCity || null : null,
    };
  });
