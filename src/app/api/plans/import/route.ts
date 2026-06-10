import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import {
  createPlanImport,
  getExistingPlanEntryDates,
  type PlanImportEntry,
} from "@/server/planImports";

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const runtime = "nodejs";

type ParsedRow = {
  rowNumber: number;
  date: string;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  rawRow: { date: string; task: string; comment?: string; isWorkload: boolean };
};

type PlanImportIssue = { row: number; message: string };

type ParseResult = {
  rows: ParsedRow[];
  errors: PlanImportIssue[];
  sheetName: string;
  foundHeaders: string[];
  totalRows: number;
};

type PlanImportErrorMeta = {
  details?: string[] | undefined;
  errors?: PlanImportIssue[] | undefined;
  warnings?: PlanImportIssue[] | undefined;
  foundHeaders?: string[] | undefined;
  sheetName?: string | undefined;
  totalRows?: number | undefined;
};

type ValidationError = {
  message: string;
  details?: string[];
};

type ImportEntryWithRowNumber = PlanImportEntry & {
  rowNumber: number;
};

class PlanImportError extends Error {
  details: string[] | undefined;
  errors: PlanImportIssue[] | undefined;
  warnings: PlanImportIssue[] | undefined;
  foundHeaders: string[] | undefined;
  sheetName: string | undefined;
  totalRows: number | undefined;

  constructor(message: string, meta: PlanImportErrorMeta = {}) {
    super(message);
    this.name = "PlanImportError";
    this.details = meta.details;
    this.errors = meta.errors;
    this.warnings = meta.warnings;
    this.foundHeaders = meta.foundHeaders;
    this.sheetName = meta.sheetName;
    this.totalRows = meta.totalRows;
  }
}

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const argbToCss = (argb: string) => {
  if (argb.length === 8) {
    const alpha = parseInt(argb.slice(0, 2), 16) / 255;
    const r = parseInt(argb.slice(2, 4), 16);
    const g = parseInt(argb.slice(4, 6), 16);
    const b = parseInt(argb.slice(6, 8), 16);
    if (alpha > 0.99) {
      return `#${argb.slice(2)}`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }
  return `#${argb}`;
};

const richTextToHtml = (value: ExcelJS.CellRichTextValue): string => {
  const lines: string[] = [""];

  value.richText.forEach((part) => {
    const textParts = (part.text || "").split(/\r\n|\n/);

    let style = "";
    if (part.font?.bold) {
      style += "font-weight: bold;";
    }
    if (part.font?.color?.argb) {
      const cssColor = argbToCss(part.font.color.argb);
      style += `color: ${cssColor};`;
    }

    textParts.forEach((textFragment, index) => {
      let fragment = escapeHtml(textFragment);
      if (style && fragment) {
        fragment = `<span style="${style}">${fragment}</span>`;
      }

      lines[lines.length - 1] += fragment;

      if (index < textParts.length - 1) {
        lines.push("");
      }
    });
  });

  return lines.join("\n");
};

const removeNumberedPrefix = (html: string): string => {
  const stripped = stripHtml(html);
  const match = stripped.match(/^\s*\d+\)\s*/);
  if (!match) return html;
  const prefix = match[0];

  let prefixIndex = 0;
  let htmlIndex = 0;
  const openTags: string[] = [];

  while (prefixIndex < prefix.length && htmlIndex < html.length) {
    if (html[htmlIndex] === "<") {
      const tagEnd = html.indexOf(">", htmlIndex);
      if (tagEnd === -1) break;
      const tag = html.substring(htmlIndex, tagEnd + 1);
      if (tag.startsWith("</")) {
        openTags.pop();
      } else if (!tag.endsWith("/>")) {
        openTags.push(tag);
      }
      htmlIndex = tagEnd + 1;
      continue;
    }

    if (html[htmlIndex] === prefix[prefixIndex]) {
      prefixIndex++;
      htmlIndex++;
    } else {
      htmlIndex++;
    }
  }

  const suffix = html.substring(htmlIndex);
  return openTags.join("") + suffix;
};

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    const v = value as any;
    if (typeof v.text === "string" && !v.richText) {
      return v.text;
    }
    if (Array.isArray(v.richText)) {
      return richTextToHtml(v);
    }
    if (v.result !== undefined) {
      return cellToString(v.result);
    }
  }
  return String(value ?? "");
};

const getHeaderLabels = (row: ExcelJS.Row) => {
  const headers: string[] = [];
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = cellToString(cell.value ?? cell.text).trim();
    if (text) {
      headers.push(`${colNumber}: ${text}`);
    }
  });
  return headers;
};

const isHeader = (value: string, candidates: string[]) => candidates.some((c) => value.includes(c));

const excelSerialToDate = (serial: number) => {
  const excelEpoch = Date.UTC(1899, 11, 30);
  return new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
};

const toUtcMs = (value: string): number | null => {
  const [yy, mm, dd] = value.split("-").map((part) => Number(part));
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  return Date.UTC(yy, mm - 1, dd);
};

const validateDateOrder = (rows: ParsedRow[]): ValidationError | null => {
  for (let i = 1; i < rows.length; i++) {
    const previousRow = rows[i - 1];
    const currentRow = rows[i];
    const prev = toUtcMs(previousRow.date);
    const next = toUtcMs(currentRow.date);
    if (prev === null || next === null) {
      return {
        message: "Ошибка импорта: некорректный формат даты.",
        details: ["Проверьте значения в колонке «Дата»."],
      };
    }
    if (next < prev) {
      return {
        message: "Ошибка импорта: даты должны идти по порядку.",
        details: [
          `Строка ${currentRow.rowNumber}: дата ${currentRow.date} идет после ${previousRow.date} из строки ${previousRow.rowNumber}.`,
          "Разрывы между датами допустимы, но даты в файле должны идти по возрастанию.",
        ],
      };
    }
  }
  return null;
};

const toDateString = (value: unknown): string | null => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return excelSerialToDate(value).toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const match = trimmed.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (match) {
      const [, dd, mm, yy] = match;
      const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
      const month = Number(mm) - 1;
      const day = Number(dd);
      const parsed = new Date(Date.UTC(year, month, day));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return null;
};

const hasFillColor = (cell: ExcelJS.Cell | undefined) => {
  if (!cell) {
    return false;
  }
  const fill: any = (cell as any).fill;
  if (!fill) {
    return false;
  }
  if (fill.fgColor || fill.bgColor) {
    return true;
  }
  if (Array.isArray(fill.stops)) {
    return fill.stops.some((s: any) => s?.color);
  }
  return false;
};

const NUMBERED_LINE_REGEX = /^\s*\d+\)\s*(.*)$/;

const countNumberedLines = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => NUMBERED_LINE_REGEX.test(stripHtml(line))).length;

const splitNumberedText = (value: string) => {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }
  const lines = normalized.split("\n");
  const parts: string[] = [];
  let hasNumbered = false;
  let prefix = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = stripHtml(trimmed).match(NUMBERED_LINE_REGEX);
    if (match) {
      hasNumbered = true;
      const body = removeNumberedPrefix(trimmed).trim();
      const combined = prefix ? `${prefix} ${body}` : body;
      parts.push(combined.trim());
      prefix = "";
      continue;
    }
    if (hasNumbered && parts.length) {
      parts[parts.length - 1] = `${parts[parts.length - 1]} ${trimmed}`.trim();
      continue;
    }
    prefix = prefix ? `${prefix} ${trimmed}` : trimmed;
  }
  if (!parts.length) {
    return [normalized];
  }
  return parts;
};

async function parseExcel(buffer: ArrayBuffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (error) {
    const technicalMessage = error instanceof Error ? error.message : "неизвестная ошибка чтения";
    throw new PlanImportError("Не удалось прочитать Excel-файл.", {
      details: [
        "Проверьте, что файл сохранен в формате .xlsx и не поврежден.",
        `Техническая ошибка: ${technicalMessage}`,
      ],
    });
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new PlanImportError("Файл не содержит листов.", {
      details: ["Откройте файл в Excel и убедитесь, что в книге есть хотя бы один лист."],
    });
  }

  const headerRow = sheet.getRow(1);
  const foundHeaders = getHeaderLabels(headerRow);
  let dateCol = 0;
  let taskCol = 0;
  let commentCol = 0;
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = normalizeHeader(cell.text || cell.value);
    if (!dateCol && isHeader(header, ["дата", "date"])) {
      dateCol = colNumber;
    }
    if (!taskCol && isHeader(header, ["задан", "task", "workout"])) {
      taskCol = colNumber;
    }
    if (!commentCol && isHeader(header, ["коммент", "comment"])) {
      commentCol = colNumber;
    }
  });

  if (!dateCol || !taskCol) {
    const missingHeaders: string[] = [];
    if (!dateCol) {
      missingHeaders.push("Дата");
    }
    if (!taskCol) {
      missingHeaders.push("Задание");
    }
    throw new PlanImportError("Не найдены колонки Дата/Задание в первой строке.", {
      sheetName: sheet.name,
      foundHeaders,
      details: [
        `Не найдены колонки: ${missingHeaders.join(", ")}.`,
        "Колонка даты должна содержать в заголовке «Дата» или «date».",
        "Колонка задания должна содержать в заголовке «Задан», «task» или «workout».",
      ],
    });
  }

  const rows: ParsedRow[] = [];
  const errors: ParseResult["errors"] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const dateCellObj = row.getCell(dateCol);
    const taskCellObj = row.getCell(taskCol);
    const commentCellObj = commentCol > 0 ? row.getCell(commentCol) : undefined;

    const dateCell = dateCellObj.value;
    const taskCell = taskCellObj.value;
    const commentCell = commentCol > 0 ? row.getCell(commentCol).value : "";

    const date = toDateString(dateCell);
    const taskText = cellToString(taskCell).trim();
    const commentTextRaw = cellToString(commentCell).trim();

    if (!date && !taskText && !commentTextRaw) {
      continue;
    }
    if (!date) {
      errors.push({ row: rowNumber, message: "Некорректная дата" });
      continue;
    }
    if (!taskText) {
      errors.push({ row: rowNumber, message: "Пустое задание" });
      continue;
    }

    const isWorkload =
      hasFillColor(taskCellObj) ||
      hasFillColor(dateCellObj) ||
      (commentCellObj ? hasFillColor(commentCellObj) : false);

    const taskLineCount = countNumberedLines(taskText);
    const taskChunks =
      taskLineCount > 1 ? splitNumberedText(taskText).filter((chunk) => chunk.length > 0) : [];
    const tasks = taskChunks.length ? taskChunks : [taskText];
    const hasMultipleTasks = tasks.length > 1;
    const hasNumberedComments =
      hasMultipleTasks && commentTextRaw ? countNumberedLines(commentTextRaw) > 0 : false;
    const commentChunks = hasNumberedComments ? splitNumberedText(commentTextRaw) : [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      let comment = "";
      if (commentTextRaw) {
        if (hasMultipleTasks) {
          comment = hasNumberedComments ? (commentChunks[i] ?? "") : commentTextRaw;
        } else {
          comment = commentTextRaw;
        }
      }
      const normalizedComment = comment.trim();
      rows.push({
        rowNumber,
        date,
        taskText: task,
        commentText: normalizedComment.length ? normalizedComment : null,
        isWorkload,
        rawRow: {
          date,
          task,
          isWorkload,
          ...(normalizedComment ? { comment: normalizedComment } : {}),
        },
      });
    }
  }

  return {
    rows,
    errors,
    sheetName: sheet.name,
    foundHeaders,
    totalRows: Math.max(0, sheet.rowCount - 1),
  };
}

const createErrorPayload = (message: string, meta: PlanImportErrorMeta = {}) => ({
  error: message,
  ...(meta.details ? { details: meta.details } : {}),
  ...(meta.errors ? { errors: meta.errors } : {}),
  ...(meta.warnings ? { warnings: meta.warnings } : {}),
  ...(meta.foundHeaders ? { foundHeaders: meta.foundHeaders } : {}),
  ...(meta.sheetName ? { sheetName: meta.sheetName } : {}),
  ...(typeof meta.totalRows === "number" ? { totalRows: meta.totalRows } : {}),
});

const stripRowNumbers = (entries: ImportEntryWithRowNumber[]): PlanImportEntry[] =>
  entries.map(({ rowNumber: _rowNumber, ...entry }) => entry);

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Не найден файл в поле file" }, { status: 400 });
  }

  const filename = (file as any).name ?? "plan.xlsx";
  const normalizedFilename = filename.toLowerCase();
  if (normalizedFilename.endsWith(".xls") && !normalizedFilename.endsWith(".xlsx")) {
    return NextResponse.json(
      createErrorPayload("Формат .xls не поддерживается для импорта плана.", {
        details: [
          "Сохраните файл в Excel как «Книга Excel (*.xlsx)» и загрузите его повторно.",
          `Выбранный файл: ${filename}.`,
        ],
      }),
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();

  let parsed: ParseResult;
  try {
    parsed = await parseExcel(buffer);
  } catch (err) {
    if (err instanceof PlanImportError) {
      return NextResponse.json(
        createErrorPayload(err.message, {
          details: err.details,
          errors: err.errors,
          foundHeaders: err.foundHeaders,
          sheetName: err.sheetName,
          totalRows: err.totalRows,
        }),
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : "Не удалось прочитать файл";
    return NextResponse.json(
      createErrorPayload(message, {
        details: ["Файл не удалось обработать. Проверьте формат и структуру книги."],
      }),
      { status: 400 }
    );
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      createErrorPayload("Файл пуст или не содержит валидных строк", {
        errors: parsed.errors,
        foundHeaders: parsed.foundHeaders,
        sheetName: parsed.sheetName,
        totalRows: parsed.totalRows,
        details: [
          `Лист: ${parsed.sheetName}.`,
          `Строк после заголовка: ${parsed.totalRows}.`,
          "Для импорта нужны заполненные колонки «Дата» и «Задание».",
        ],
      }),
      { status: 400 }
    );
  }

  const dateOrderError = validateDateOrder(parsed.rows);
  if (dateOrderError) {
    return NextResponse.json(
      createErrorPayload(dateOrderError.message, {
        details: dateOrderError.details,
        errors: parsed.errors,
        foundHeaders: parsed.foundHeaders,
        sheetName: parsed.sheetName,
        totalRows: parsed.totalRows,
      }),
      { status: 400 }
    );
  }

  const sessionCounter = new Map<string, number>();
  const entries: ImportEntryWithRowNumber[] = parsed.rows.map((row) => {
    const current = sessionCounter.get(row.date) ?? 0;
    const next = current + 1;
    sessionCounter.set(row.date, next);
    return {
      rowNumber: row.rowNumber,
      userId,
      date: row.date,
      sessionOrder: next,
      taskText: row.taskText,
      commentText: row.commentText,
      isWorkload: row.isWorkload,
      rawRow: row.rawRow,
    };
  });

  const dates = Array.from(sessionCounter.keys());
  const existingDates = await getExistingPlanEntryDates(userId, dates);
  const newEntries = entries.filter((entry) => !existingDates.has(entry.date));
  const createdImport = await createPlanImport({
    userId,
    filename,
    rowCount: parsed.rows.length,
    entries: stripRowNumbers(entries),
    newEntries: stripRowNumbers(newEntries),
    errorsCount: parsed.errors.length,
  });

  const skippedDates = entries.length - createdImport.insertedCount;
  const payload = {
    importId: createdImport.id,
    inserted: createdImport.insertedCount,
    skipped: parsed.errors.length + Math.max(0, skippedDates),
    errors: parsed.errors,
    sheetName: parsed.sheetName,
    totalRows: parsed.totalRows,
  };
  return NextResponse.json(payload);
}
