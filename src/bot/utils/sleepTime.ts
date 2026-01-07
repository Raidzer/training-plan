const TIME_INPUT_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const normalizeSleepInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
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

export const formatSleepTimeValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return "";
  }
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
  const normalized = normalizeSleepInput(value);
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
