import {
  COMPETITION_PRIORITIES,
  MAX_COMPETITION_BLOCK_TITLE_LENGTH,
  MAX_COMPETITION_DISTANCE_LABEL_LENGTH,
  MAX_COMPETITION_NAME_LOCATION_LENGTH,
  MAX_COMPETITION_RESULT_LENGTH,
  type CompetitionPriority,
} from "@/shared/constants/competitions";
import { isValidDateString } from "@/shared/utils/diaryUtils";
import { parseCompetitionDistanceMeters } from "@/shared/utils/competitionUtils";

type ParseResult<T> = { valid: true; value: T } | { valid: false; error: string };

export type CompetitionBlockPayload = {
  title?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

export type CompetitionPayload = {
  date?: unknown;
  nameLocation?: unknown;
  distanceLabel?: unknown;
  priority?: unknown;
  result?: unknown;
};

export type ParsedCompetitionBlockCreate = {
  title: string;
  startDate: string;
  endDate: string;
};

export type ParsedCompetitionBlockUpdate = {
  title?: string;
  startDate?: string;
  endDate?: string;
};

export type ParsedCompetitionCreate = {
  date: string;
  nameLocation: string;
  distanceMeters: number | null;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string | null;
};

export type ParsedCompetitionUpdate = {
  date?: string;
  nameLocation?: string;
  distanceMeters?: number | null;
  distanceLabel?: string;
  priority?: CompetitionPriority;
  result?: string | null;
};

const competitionPriorityValues = new Set<string>(Object.values(COMPETITION_PRIORITIES));

const parseRequiredText = (
  value: unknown,
  maxLength: number,
  error: string
): ParseResult<string> => {
  if (typeof value !== "string") {
    return { valid: false, error };
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return { valid: false, error };
  }

  return { valid: true, value: trimmed };
};

const parseOptionalText = (
  value: unknown,
  maxLength: number,
  error: string
): ParseResult<string | null | undefined> => {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  if (value === null) {
    return { valid: true, value: null };
  }

  if (typeof value !== "string") {
    return { valid: false, error };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: true, value: null };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error };
  }

  return { valid: true, value: trimmed };
};

const parseRequiredDate = (value: unknown): ParseResult<string> => {
  if (typeof value !== "string" || !isValidDateString(value)) {
    return { valid: false, error: "invalid_date" };
  }

  return { valid: true, value };
};

const parseOptionalDate = (value: unknown): ParseResult<string | undefined> => {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  if (typeof value !== "string" || !isValidDateString(value)) {
    return { valid: false, error: "invalid_date" };
  }

  return { valid: true, value };
};

const parseRequiredPriority = (value: unknown): ParseResult<CompetitionPriority> => {
  const priority = typeof value === "string" ? value.trim() : "";
  if (!competitionPriorityValues.has(priority)) {
    return { valid: false, error: "invalid_priority" };
  }

  return { valid: true, value: priority as CompetitionPriority };
};

const parseOptionalPriority = (value: unknown): ParseResult<CompetitionPriority | undefined> => {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  return parseRequiredPriority(value);
};

const parseDistanceLabel = (
  value: unknown
): ParseResult<{ distanceLabel: string; distanceMeters: number | null }> => {
  const distanceLabel = parseRequiredText(
    value,
    MAX_COMPETITION_DISTANCE_LABEL_LENGTH,
    "invalid_distance"
  );

  if (!distanceLabel.valid) {
    return distanceLabel;
  }

  return {
    valid: true,
    value: {
      distanceLabel: distanceLabel.value,
      distanceMeters: parseCompetitionDistanceMeters(distanceLabel.value),
    },
  };
};

const hasBlockUpdates = (value: ParsedCompetitionBlockUpdate) =>
  value.title !== undefined || value.startDate !== undefined || value.endDate !== undefined;

const hasCompetitionUpdates = (value: ParsedCompetitionUpdate) =>
  value.date !== undefined ||
  value.nameLocation !== undefined ||
  value.distanceLabel !== undefined ||
  value.priority !== undefined ||
  value.result !== undefined;

export const parseCompetitionBlockCreatePayload = (
  payload: CompetitionBlockPayload | null
): ParseResult<ParsedCompetitionBlockCreate> => {
  const title = parseRequiredText(
    payload?.title,
    MAX_COMPETITION_BLOCK_TITLE_LENGTH,
    "invalid_title"
  );
  if (!title.valid) {
    return title;
  }

  const startDate = parseRequiredDate(payload?.startDate);
  if (!startDate.valid) {
    return startDate;
  }

  const endDate = parseRequiredDate(payload?.endDate);
  if (!endDate.valid) {
    return endDate;
  }

  if (startDate.value > endDate.value) {
    return { valid: false, error: "invalid_period" };
  }

  return {
    valid: true,
    value: {
      title: title.value,
      startDate: startDate.value,
      endDate: endDate.value,
    },
  };
};

export const parseCompetitionBlockUpdatePayload = (
  payload: CompetitionBlockPayload | null
): ParseResult<ParsedCompetitionBlockUpdate> => {
  const title =
    payload?.title === undefined
      ? ({ valid: true, value: undefined } as const)
      : parseRequiredText(payload.title, MAX_COMPETITION_BLOCK_TITLE_LENGTH, "invalid_title");
  if (!title.valid) {
    return title;
  }

  const startDate = parseOptionalDate(payload?.startDate);
  if (!startDate.valid) {
    return startDate;
  }

  const endDate = parseOptionalDate(payload?.endDate);
  if (!endDate.valid) {
    return endDate;
  }

  if (
    startDate.value !== undefined &&
    endDate.value !== undefined &&
    startDate.value > endDate.value
  ) {
    return { valid: false, error: "invalid_period" };
  }

  const parsed: ParsedCompetitionBlockUpdate = {};

  if (title.value !== undefined) {
    parsed.title = title.value;
  }
  if (startDate.value !== undefined) {
    parsed.startDate = startDate.value;
  }
  if (endDate.value !== undefined) {
    parsed.endDate = endDate.value;
  }

  if (!hasBlockUpdates(parsed)) {
    return { valid: false, error: "empty_update" };
  }

  return { valid: true, value: parsed };
};

export const parseCompetitionCreatePayload = (
  payload: CompetitionPayload | null
): ParseResult<ParsedCompetitionCreate> => {
  const date = parseRequiredDate(payload?.date);
  if (!date.valid) {
    return date;
  }

  const nameLocation = parseRequiredText(
    payload?.nameLocation,
    MAX_COMPETITION_NAME_LOCATION_LENGTH,
    "invalid_name_location"
  );
  if (!nameLocation.valid) {
    return nameLocation;
  }

  const distance = parseDistanceLabel(payload?.distanceLabel);
  if (!distance.valid) {
    return distance;
  }

  const priority = parseRequiredPriority(payload?.priority);
  if (!priority.valid) {
    return priority;
  }

  const result = parseOptionalText(
    payload?.result,
    MAX_COMPETITION_RESULT_LENGTH,
    "invalid_result"
  );
  if (!result.valid) {
    return result;
  }

  return {
    valid: true,
    value: {
      date: date.value,
      nameLocation: nameLocation.value,
      distanceMeters: distance.value.distanceMeters,
      distanceLabel: distance.value.distanceLabel,
      priority: priority.value,
      result: result.value ?? null,
    },
  };
};

export const parseCompetitionUpdatePayload = (
  payload: CompetitionPayload | null
): ParseResult<ParsedCompetitionUpdate> => {
  const date = parseOptionalDate(payload?.date);
  if (!date.valid) {
    return date;
  }

  const nameLocation =
    payload?.nameLocation === undefined
      ? ({ valid: true, value: undefined } as const)
      : parseRequiredText(
          payload.nameLocation,
          MAX_COMPETITION_NAME_LOCATION_LENGTH,
          "invalid_name_location"
        );
  if (!nameLocation.valid) {
    return nameLocation;
  }

  const distance =
    payload?.distanceLabel === undefined
      ? ({ valid: true, value: undefined } as const)
      : parseDistanceLabel(payload.distanceLabel);
  if (!distance.valid) {
    return distance;
  }

  const priority = parseOptionalPriority(payload?.priority);
  if (!priority.valid) {
    return priority;
  }

  const result = parseOptionalText(
    payload?.result,
    MAX_COMPETITION_RESULT_LENGTH,
    "invalid_result"
  );
  if (!result.valid) {
    return result;
  }

  const parsed: ParsedCompetitionUpdate = {};

  if (date.value !== undefined) {
    parsed.date = date.value;
  }
  if (nameLocation.value !== undefined) {
    parsed.nameLocation = nameLocation.value;
  }
  if (distance.value !== undefined) {
    parsed.distanceMeters = distance.value.distanceMeters;
    parsed.distanceLabel = distance.value.distanceLabel;
  }
  if (priority.value !== undefined) {
    parsed.priority = priority.value;
  }
  if (result.value !== undefined) {
    parsed.result = result.value;
  }

  if (!hasCompetitionUpdates(parsed)) {
    return { valid: false, error: "empty_update" };
  }

  return { valid: true, value: parsed };
};
