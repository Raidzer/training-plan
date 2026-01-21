export const KM_PER_MILE = 1.609344;

export const toNonNegativeFloat = (value: string | number): number => {
  if (typeof value === "number") {
    return Math.max(0, value);
  }
  const normalized = value.replace(",", ".");
  const parsed = parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
};

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

export const roundTo = (value: number, digits: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const splitMinutesSeconds = (totalMinutes: number) => {
  if (!Number.isFinite(totalMinutes)) {
    return { minutes: 0, seconds: 0 };
  }
  if (totalMinutes <= 0) {
    return { minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.round(totalMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
};

export const toTotalMinutes = (minutes: number, seconds: number) => {
  if (!Number.isFinite(minutes)) {
    return 0;
  }
  if (!Number.isFinite(seconds)) {
    return 0;
  }
  const safeMinutes = Math.max(0, minutes);
  const safeSeconds = Math.max(0, seconds);
  if (safeMinutes === 0 && safeSeconds === 0) {
    return 0;
  }
  return safeMinutes + safeSeconds / 60;
};

export const parseTimeInputToTotalMinutes = (value: string): number => {
  if (!value) return 0;
  const parts = value.split(":");
  let totalMinutes = 0;
  // TimeInput usually gives "HH:MM:SS" or "MM:SS" (if we force it?) or just "12:34"
  // If we treat "12:34" as 12 min 34 sec -> standard expectation for Pace.

  if (parts.length === 3) {
    // HH:MM:SS -> probably not used for Pace (hours per km??) but if so:
    totalMinutes += Number(parts[0]) * 60;
    totalMinutes += Number(parts[1]);
    totalMinutes += Number(parts[2]) / 60;
  } else if (parts.length === 2) {
    // MM:SS
    totalMinutes += Number(parts[0]);
    totalMinutes += Number(parts[1]) / 60;
  } else if (parts.length === 1) {
    // Just minutes? Or seconds? Assuming Minutes if it's "Pace" context and single number usually implies integer minutes?
    // But TimeInput masks with colons.
    totalMinutes += Number(parts[0]);
  }
  return totalMinutes;
};
