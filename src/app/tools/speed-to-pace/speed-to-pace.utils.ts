export const KM_PER_MILE = 1.609344;

export const toNonNegativeFloat = (value: string) => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  if (parsed < 0) {
    return 0;
  }
  return parsed;
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
