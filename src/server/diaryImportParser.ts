import ExcelJS from "exceljs";

export type DiaryImportIssue = {
  row: number;
  message: string;
};

export type ParsedDiaryImportRow = {
  rowNumber: number;
  sessionOrder: number;
  date: string;
  rawDate: string;
  startTime: string | null;
  taskText: string;
  resultText: string;
  commentText: string | null;
  distanceKm: number | null;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  sleepHours: number | null;
  morningWeightKg: number | null;
  eveningWeightKg: number | null;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
};

export type ParsedDiaryImport = {
  sheetName: string;
  rows: ParsedDiaryImportRow[];
  errors: DiaryImportIssue[];
  warnings: DiaryImportIssue[];
};

type HeaderMap = {
  date: number;
  task: number;
  result: number;
  comment: number;
  score: number;
  sleep: number;
  weight: number;
  recovery: number;
  volume: number;
};

const DATE_HEADER_CANDIDATES = ["дата", "date"];
const TASK_HEADER_CANDIDATES = ["задание", "задан", "task", "workout"];
const RESULT_HEADER_CANDIDATES = ["результат", "result"];
const COMMENT_HEADER_CANDIDATES = ["комментар", "comment"];
const SCORE_HEADER_CANDIDATES = ["оценка", "score"];
const SLEEP_HEADER_CANDIDATES = ["сон", "sleep"];
const WEIGHT_HEADER_CANDIDATES = ["вес", "weight"];
const RECOVERY_HEADER_CANDIDATES = ["восстанов", "массаж", "баня", "recovery"];
const VOLUME_HEADER_CANDIDATES = ["объём", "объем", "volume"];
const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");

const hasHeaderCandidate = (header: string, candidates: string[]) =>
  candidates.some((candidate) => header.includes(candidate));

const isDateLike = (value: unknown): value is Date =>
  Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as Date).getTime === "function" &&
    typeof (value as Date).toISOString === "function"
  );

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (isDateLike(value)) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    const objectValue = value as {
      text?: unknown;
      richText?: Array<{ text?: string }>;
      result?: unknown;
    };
    if (typeof objectValue.text === "string" && !objectValue.richText) {
      return objectValue.text;
    }
    if (Array.isArray(objectValue.richText)) {
      return objectValue.richText.map((part) => part.text ?? "").join("");
    }
    if (objectValue.result !== undefined) {
      return cellToString(objectValue.result);
    }
  }
  return String(value);
};

const getCellValue = (row: ExcelJS.Row, colNumber: number) => row.getCell(colNumber).value;

const getCellText = (row: ExcelJS.Row, colNumber: number) =>
  cellToString(getCellValue(row, colNumber)).trim();

const excelSerialToDate = (serial: number) => {
  return new Date(Date.UTC(1899, 11, 30) + serial * DAY_MS);
};

const toIsoDate = (year: number, month: number, day: number) => {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
};

const parseDateValue = (value: unknown): string | null => {
  if (isDateLike(value)) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return excelSerialToDate(value).toISOString().slice(0, 10);
  }

  const text = cellToString(value).trim();
  if (!text) {
    return null;
  }

  const match = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!match) {
    return null;
  }

  const [, dayText, monthText, yearText] = match;
  const year = yearText.length === 2 ? Number(`20${yearText}`) : Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return toIsoDate(year, month, day);
};

const parseWeekdayLabel = (value: string) => {
  const match = value.match(/\((Вс|Пн|Вт|Ср|Чт|Пт|Сб)\)/i);
  if (!match) {
    return null;
  }
  return match[1];
};

const getWeekdayLabel = (date: string) => {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return WEEKDAY_LABELS[parsed.getUTCDay()] ?? null;
};

const parseStartTime = (value: string) => {
  const match = value.match(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?=$|[^\d])/);
  if (!match) {
    return null;
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const parseScore = (value: string) => {
  const text = value.trim();
  if (!text) {
    return null;
  }

  const matches = text.match(/\d{1,2}/g) ?? [];
  if (matches.length !== 3) {
    return null;
  }

  const scores = matches.map((part) => Number(part));
  const isValid = scores.every((score) => Number.isInteger(score) && score >= 1 && score <= 10);
  if (!isValid) {
    return null;
  }

  return scores as [number, number, number];
};

const parseSleepHours = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    if (value > 0 && value < 1) {
      return Math.round(value * 24 * 100) / 100;
    }
    return Math.round(value * 100) / 100;
  }
  if (isDateLike(value)) {
    const hours = value.getUTCHours() + value.getUTCMinutes() / 60 + value.getUTCSeconds() / 3600;
    return Math.round(hours * 100) / 100;
  }

  const parseSleepPart = (part: string) => {
    const timeMatch = part.match(/^(\d{1,2}):([0-5]\d)$/);
    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      if (hours < 0 || hours > 24 || (hours === 24 && minutes !== 0)) {
        return null;
      }
      return hours + minutes / 60;
    }

    const parsed = Number(part);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const text = cellToString(value).trim().replace(",", ".");
  if (!text) {
    return null;
  }

  const parts = text
    .split("+")
    .map((part) => parseSleepPart(part.trim()))
    .filter((part): part is number => part !== null);
  if (parts.length === 0) {
    return null;
  }

  return Math.round(parts.reduce((sum, part) => sum + part, 0) * 100) / 100;
};

const parseWeightValues = (value: string) => {
  const matches = value.match(/\d{2,3}(?:[,.]\d{1,2})?/g) ?? [];
  return matches
    .map((match) => Number(match.replace(",", ".")))
    .filter((weight) => Number.isFinite(weight));
};

const parseDistanceKm = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Math.round(value * 100) / 100;
  }

  const text = cellToString(value).replace(",", ".");
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
};

const parseRecoveryFlags = (value: string) => {
  const normalized = value.toLowerCase();
  return {
    hasBath: /бан/.test(normalized),
    hasMfr: /мфр/.test(normalized),
    hasMassage: /массаж/.test(normalized),
  };
};

const findDiaryWorksheet = (workbook: ExcelJS.Workbook) => {
  const sheet = workbook.worksheets.find((worksheet) =>
    normalizeHeader(worksheet.name).startsWith("дневник")
  );
  if (!sheet) {
    throw new Error("Не найден лист дневника. Название листа должно начинаться с «Дневник».");
  }
  return sheet;
};

const buildHeaderMap = (sheet: ExcelJS.Worksheet): HeaderMap => {
  const headerRow = sheet.getRow(1);
  const headerMap: HeaderMap = {
    date: 0,
    task: 0,
    result: 0,
    comment: 0,
    score: 0,
    sleep: 0,
    weight: 0,
    recovery: 0,
    volume: 0,
  };

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = normalizeHeader(cellToString(cell.value));
    if (!headerMap.date && hasHeaderCandidate(header, DATE_HEADER_CANDIDATES)) {
      headerMap.date = colNumber;
    }
    if (!headerMap.task && hasHeaderCandidate(header, TASK_HEADER_CANDIDATES)) {
      headerMap.task = colNumber;
    }
    if (!headerMap.result && hasHeaderCandidate(header, RESULT_HEADER_CANDIDATES)) {
      headerMap.result = colNumber;
    }
    if (!headerMap.comment && hasHeaderCandidate(header, COMMENT_HEADER_CANDIDATES)) {
      headerMap.comment = colNumber;
    }
    if (!headerMap.score && hasHeaderCandidate(header, SCORE_HEADER_CANDIDATES)) {
      headerMap.score = colNumber;
    }
    if (hasHeaderCandidate(header, SLEEP_HEADER_CANDIDATES)) {
      headerMap.sleep = colNumber;
    }
    if (hasHeaderCandidate(header, WEIGHT_HEADER_CANDIDATES)) {
      headerMap.weight = colNumber;
    }
    if (!headerMap.recovery && hasHeaderCandidate(header, RECOVERY_HEADER_CANDIDATES)) {
      headerMap.recovery = colNumber;
    }
    if (hasHeaderCandidate(header, VOLUME_HEADER_CANDIDATES)) {
      headerMap.volume = colNumber;
    }
  });

  if (!headerMap.date || !headerMap.task) {
    throw new Error("Не найдены колонки «Дата» и «Задание» на листе дневника.");
  }

  return headerMap;
};

const hasUnexpectedContentWithoutDate = (params: {
  taskText: string;
  resultText: string;
  commentText: string;
  scoreText: string;
}) => {
  return Boolean(params.taskText || params.resultText || params.commentText || params.scoreText);
};

export async function parseDiaryWorkbook(
  buffer: ArrayBuffer | Uint8Array
): Promise<ParsedDiaryImport> {
  const workbook = new ExcelJS.Workbook();
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const workbookBuffer = Buffer.from(bytes) as unknown as Parameters<
    ExcelJS.Workbook["xlsx"]["load"]
  >[0];
  await workbook.xlsx.load(workbookBuffer);

  const sheet = findDiaryWorksheet(workbook);
  const headerMap = buildHeaderMap(sheet);
  const rows: ParsedDiaryImportRow[] = [];
  const errors: DiaryImportIssue[] = [];
  const warnings: DiaryImportIssue[] = [];
  const sessionOrderByDate = new Map<string, number>();

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const rawDate = getCellText(row, headerMap.date);
    const date = parseDateValue(getCellValue(row, headerMap.date));
    const taskText = headerMap.task ? getCellText(row, headerMap.task) : "";
    const resultText = headerMap.result ? getCellText(row, headerMap.result) : "";
    const rawCommentText = headerMap.comment ? getCellText(row, headerMap.comment) : "";
    const scoreText = headerMap.score ? getCellText(row, headerMap.score) : "";
    const sleepHours = headerMap.sleep ? parseSleepHours(getCellValue(row, headerMap.sleep)) : null;
    const weightValues = headerMap.weight
      ? parseWeightValues(getCellText(row, headerMap.weight))
      : [];
    const recovery = headerMap.recovery
      ? parseRecoveryFlags(getCellText(row, headerMap.recovery))
      : { hasBath: false, hasMfr: false, hasMassage: false };
    const distanceKm = headerMap.volume
      ? parseDistanceKm(getCellValue(row, headerMap.volume))
      : null;

    const hasDailyData =
      sleepHours !== null ||
      weightValues.length > 0 ||
      recovery.hasBath ||
      recovery.hasMfr ||
      recovery.hasMassage ||
      distanceKm !== null;
    const hasWorkoutText = Boolean(taskText || resultText || rawCommentText || scoreText);

    if (!date && !hasDailyData && !hasWorkoutText) {
      continue;
    }
    if (!date) {
      if (
        hasUnexpectedContentWithoutDate({
          taskText,
          resultText,
          commentText: rawCommentText,
          scoreText,
        })
      ) {
        errors.push({ row: rowNumber, message: "Некорректная дата" });
      }
      continue;
    }

    const declaredWeekday = parseWeekdayLabel(rawDate);
    const actualWeekday = getWeekdayLabel(date);
    if (
      declaredWeekday &&
      actualWeekday &&
      declaredWeekday.toLowerCase() !== actualWeekday.toLowerCase()
    ) {
      warnings.push({
        row: rowNumber,
        message: `Дата ${date} не соответствует дню недели «${declaredWeekday}».`,
      });
    }

    const score = parseScore(scoreText);
    if (scoreText && !score) {
      warnings.push({ row: rowNumber, message: "Оценка не распознана." });
    }

    const currentSessionOrder = sessionOrderByDate.get(date) ?? 0;
    const sessionOrder = currentSessionOrder + 1;
    sessionOrderByDate.set(date, sessionOrder);

    rows.push({
      rowNumber,
      sessionOrder,
      date,
      rawDate,
      startTime: parseStartTime(rawDate),
      taskText,
      resultText,
      commentText: rawCommentText || null,
      distanceKm,
      overallScore: score ? score[0] : null,
      functionalScore: score ? score[1] : null,
      muscleScore: score ? score[2] : null,
      sleepHours,
      morningWeightKg: weightValues[0] ?? null,
      eveningWeightKg: weightValues[1] ?? null,
      hasBath: recovery.hasBath,
      hasMfr: recovery.hasMfr,
      hasMassage: recovery.hasMassage,
    });
  }

  return {
    sheetName: sheet.name,
    rows,
    errors,
    warnings,
  };
}
