import type { AliceSleepCommand, AliceWeightCommand, AliceWeightPeriod } from "./types";

const normalizeNumericText = (text: string) => {
  return text
    .replace("с половиной", ".5")
    .replace(" с ", ".")
    .replace(" и ", ".")
    .replace(/,/g, ".");
};

const SLEEP_MARKER_PATTERN =
  /(^|[^\p{L}\p{N}])(сон|сна|сном|спал|спала|поспал|поспала)(?=$|[^\p{L}\p{N}])/u;

const parseCompactSleepTime = (value: string) => {
  const hours = Number(value.slice(0, -2));
  const minutes = Number(value.slice(-2));
  const sleepHours = hours + minutes / 60;

  if (!Number.isFinite(sleepHours) || minutes > 59 || sleepHours < 0 || sleepHours > 24) {
    return null;
  }

  return { sleepHours: Math.round(sleepHours * 100) / 100 };
};

const roundSleepHours = (sleepHours: number) => {
  return { sleepHours: Math.round(sleepHours * 100) / 100 };
};

const parseHoursAndValueSleepTime = (hoursRaw: string, valueRaw: string) => {
  const hours = Number(hoursRaw);
  const value = Number(valueRaw);
  const valueAsHours = /^0\d$/.test(valueRaw) ? value / 60 : value < 10 ? value / 10 : value / 60;
  const sleepHours = hours + valueAsHours;

  if (!Number.isFinite(sleepHours) || value > 59 || sleepHours < 0 || sleepHours > 24) {
    return null;
  }

  return roundSleepHours(sleepHours);
};

export const hasSleepMarker = (text: string) => {
  return SLEEP_MARKER_PATTERN.test(text.toLowerCase());
};

export function parseWeightCommand(text: string): AliceWeightCommand | null {
  const lowerText = text.toLowerCase();

  let period: AliceWeightPeriod = "morning";
  if (lowerText.includes("вечер") || lowerText.includes("вечером")) {
    period = "evening";
  }

  const cleanText = normalizeNumericText(lowerText);

  const weightMatch = cleanText.match(/(\d{2,3}(?:\.\d{1,2})?)/);
  if (!weightMatch) {
    return null;
  }

  const weight = parseFloat(weightMatch[1]);
  if (isNaN(weight) || weight < 30 || weight > 200) {
    return null;
  }

  return { weight, period };
}

export function parseSleepCommand(
  text: string,
  options: { allowNumericOnly?: boolean } = {}
): AliceSleepCommand | null {
  const lowerText = text.toLowerCase();

  if (!hasSleepMarker(lowerText) && !options.allowNumericOnly) {
    return null;
  }

  const hoursAndValueMatch = lowerText.match(
    /(^|[^\p{L}\p{N}])(\d{1,2})\s+(?:и\s+)?(\d{1,2})(?=$|[^\p{L}\p{N}])/u
  );
  if (hoursAndValueMatch) {
    return parseHoursAndValueSleepTime(hoursAndValueMatch[2], hoursAndValueMatch[3]);
  }

  const hoursMinutesMatch = lowerText.match(
    /(\d{1,2})\s*(?:час(?:а|ов)?|ч)\s*(?:(\d{1,2})\s*(?:минут(?:ы)?|мин)?)?/
  );
  if (hoursMinutesMatch) {
    const hours = Number(hoursMinutesMatch[1]);
    const minutes = hoursMinutesMatch[2] ? Number(hoursMinutesMatch[2]) : 0;
    const sleepHours = hours + minutes / 60;

    if (!Number.isFinite(sleepHours) || minutes > 59 || sleepHours < 0 || sleepHours > 24) {
      return null;
    }

    return { sleepHours: Math.round(sleepHours * 100) / 100 };
  }

  const compactTimeMatch = lowerText.match(/(^|[^\p{L}\p{N}])(\d{3,4})(?=$|[^\p{L}\p{N}])/u);
  if (compactTimeMatch) {
    return parseCompactSleepTime(compactTimeMatch[2]);
  }

  const cleanText = normalizeNumericText(lowerText);
  const sleepMatch = cleanText.match(/(\d{1,2}(?:\.\d{1,2})?)/);
  if (!sleepMatch) {
    return null;
  }

  const sleepHours = parseFloat(sleepMatch[1]);
  if (isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24) {
    return null;
  }

  return { sleepHours };
}
