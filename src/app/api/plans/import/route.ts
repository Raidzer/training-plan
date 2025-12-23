import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { planEntries, planImports } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const runtime = "nodejs";

type ParsedRow = {
  date: string;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  rawRow: { date: string; task: string; comment?: string; isWorkload: boolean };
};

type ParseResult = {
  rows: ParsedRow[];
  errors: { row: number; message: string }[];
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const v = value as any;
    if (typeof v.text === "string") return v.text;
    if (Array.isArray(v.richText))
      return v.richText.map((r: any) => r?.text ?? "").join("");
    if (v.result !== undefined) return cellToString(v.result);
  }
  return String(value ?? "");
};

const isHeader = (value: string, candidates: string[]) =>
  candidates.some((c) => value.includes(c));

const excelSerialToDate = (serial: number) => {
  const excelEpoch = Date.UTC(1899, 11, 30);
  return new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
};

const toDateString = (value: unknown): string | null => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number")
    return excelSerialToDate(value).toISOString().slice(0, 10);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (match) {
      const [_, dd, mm, yy] = match;
      const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
      const month = Number(mm) - 1;
      const day = Number(dd);
      const parsed = new Date(Date.UTC(year, month, day));
      if (!Number.isNaN(parsed.getTime()))
        return parsed.toISOString().slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString().slice(0, 10);
  }
  return null;
};

const hasFillColor = (cell: ExcelJS.Cell | undefined) => {
  if (!cell) return false;
  const fill: any = (cell as any).fill;
  if (!fill) return false;
  if (fill.fgColor || fill.bgColor) return true;
  if (Array.isArray(fill.stops)) return fill.stops.some((s: any) => s?.color);
  return false;
};

async function parseExcel(buffer: ArrayBuffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Файл не содержит листов");

  const headerRow = sheet.getRow(1);
  let dateCol = 0;
  let taskCol = 0;
  let commentCol = 0;
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = normalizeHeader(cell.text || cell.value);
    if (!dateCol && isHeader(header, ["дата", "date"])) dateCol = colNumber;
    if (!taskCol && isHeader(header, ["задан", "task", "workout"]))
      taskCol = colNumber;
    if (!commentCol && isHeader(header, ["коммент", "comment"]))
      commentCol = colNumber;
  });

  if (!dateCol || !taskCol)
    throw new Error("Не найдены колонки Дата/Задание в первой строке");

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

    if (!date && !taskText && !commentTextRaw) continue;
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

    rows.push({
      date,
      taskText,
      commentText: commentTextRaw || null,
      isWorkload,
      rawRow: {
        date,
        task: taskText,
        isWorkload,
        ...(commentTextRaw ? { comment: commentTextRaw } : {}),
      },
    });
  }

  return { rows, errors };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number((session.user as any)?.id);
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Не найден файл в поле file" },
      { status: 400 }
    );
  }

  const filename = (file as any).name ?? "plan.xlsx";
  const buffer = await file.arrayBuffer();

  let parsed: ParseResult;
  try {
    parsed = await parseExcel(buffer);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Не удалось прочитать файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: "Файл пуст или не содержит валидных строк" },
      { status: 400 }
    );
  }

  // Нумерация сессий внутри дня по порядку строк.
  const sessionCounter = new Map<string, number>();
  const entries = parsed.rows.map((row) => {
    const current = sessionCounter.get(row.date) ?? 0;
    const next = current + 1;
    sessionCounter.set(row.date, next);
    return {
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
  const now = new Date();
  const createdImport = await db.transaction(async (tx) => {
    const [importRow] = await tx
      .insert(planImports)
      .values({
        userId,
        filename,
        rowCount: parsed.rows.length,
        insertedCount: entries.length,
        skippedCount: parsed.errors.length,
      })
      .returning({ id: planImports.id });

    if (dates.length) {
      await tx
        .delete(planEntries)
        .where(
          and(eq(planEntries.userId, userId), inArray(planEntries.date, dates))
        );
    }

    if (entries.length) {
      await tx.insert(planEntries).values(
        entries.map((e) => ({
          ...e,
          importId: importRow.id,
        }))
      );
    }

    await tx
      .update(planImports)
      .set({
        insertedCount: entries.length,
        skippedCount: parsed.errors.length,
        completedAt: now,
      })
      .where(eq(planImports.id, importRow.id));

    return importRow;
  });

  return NextResponse.json({
    importId: createdImport.id,
    inserted: entries.length,
    skipped: parsed.errors.length,
    errors: parsed.errors,
  });
}
