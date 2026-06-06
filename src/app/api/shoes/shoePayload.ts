export type ShoePayload = {
  name?: unknown;
  mileageLimitKm?: unknown;
  currentMileageKm?: unknown;
  notifyOnLimitEmail?: unknown;
  notifyOnLimitTelegram?: unknown;
};

type ParsedName = { value: string | null; valid: boolean };
type ParsedMileage = { value: number | null | undefined; valid: boolean };
type ParsedFlag = { value: boolean | undefined; valid: boolean };

const MAX_NAME_LENGTH = 255;
const MAX_MILEAGE_KM = 99999.99;

export const parseName = (value: unknown, required: boolean): ParsedName => {
  if (value === undefined) {
    return { value: null, valid: !required };
  }
  if (typeof value !== "string") {
    return { value: null, valid: false };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null, valid: false };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { value: null, valid: false };
  }

  return { value: trimmed, valid: true };
};

export const parseOptionalMileageKm = (value: unknown): ParsedMileage => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }

  const textValue = typeof value === "string" ? value.trim() : null;
  if (textValue === "") {
    return { value: null, valid: true };
  }

  const parsed = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_MILEAGE_KM) {
    return { value: null, valid: false };
  }

  return { value: Math.round(parsed * 100) / 100, valid: true };
};

export const parseOptionalFlag = (value: unknown): ParsedFlag => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: false, valid: true };
  }
  if (typeof value === "boolean") {
    return { value, valid: true };
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return { value: false, valid: true };
    }
    if (normalized === "true") {
      return { value: true, valid: true };
    }
    if (normalized === "false") {
      return { value: false, valid: true };
    }
  }

  return { value: undefined, valid: false };
};
