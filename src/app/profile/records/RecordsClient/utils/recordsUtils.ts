import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  PERSONAL_RECORD_DISTANCES,
  PERSONAL_RECORD_TIME_REGEX,
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

export const getRecordsFromResponse = (data: unknown): ApiRecord[] => {
  if (!data || typeof data !== "object") {
    return [];
  }

  const value = (data as { records?: unknown }).records;
  if (!Array.isArray(value)) {
    return [];
  }

  return value as ApiRecord[];
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
