export const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateInTimeZone = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

export const getZonedDateTime = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  const minute = getPart("minute");

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Не удалось получить дату и время");
  }

  if (hour === "24") {
    hour = "00";
  }

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
};

export const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const RU_WEEKDAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const isValidDateParts = (year: number, month: number, day: number) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const formatDateForDisplay = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
    return isoDate;
  }
  return `${day}-${month}-${year}`;
};

export const parseDisplayDate = (value: string) => {
  const match = value.match(/\d{2}-\d{2}-\d{4}/);
  if (!match) {
    return null;
  }
  const [day, month, year] = match[0].split("-");
  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (!isValidDateParts(yearNum, monthNum, dayNum)) {
    return null;
  }
  return `${year}-${month}-${day}`;
};

export const addDaysToIsoDate = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split("-");
  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (!isValidDateParts(yearNum, monthNum, dayNum)) {
    return isoDate;
  }
  const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
  date.setUTCDate(date.getUTCDate() + days);
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export const getNextIsoDates = (isoDate: string, daysCount: number) => {
  return Array.from({ length: daysCount }, (_, index) =>
    addDaysToIsoDate(isoDate, index + 1)
  );
};

export const getWeekdayShortRu = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (!isValidDateParts(yearNum, monthNum, dayNum)) {
    return "";
  }
  const weekdayIndex = new Date(Date.UTC(yearNum, monthNum - 1, dayNum)).getUTCDay();
  return RU_WEEKDAYS_SHORT[weekdayIndex] ?? "";
};

export const normalizeDateValue = (value: string | Date | null) => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return formatDateLocal(value);
};
