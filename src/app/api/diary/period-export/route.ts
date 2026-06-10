import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { buildDateRange } from "@/shared/utils/diaryUtils";
import {
  getDiaryExportRows,
  getFullDiaryDateRange,
  getDiaryWeeklyVolumesBySunday,
  isValidDateString,
} from "@/server/diary";

export const runtime = "nodejs";

const DIARY_HEADER_ROW_HEIGHT = 105;
const DIARY_TASK_COLUMN_WIDTH = 101.125;

const DIARY_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 20,
  color: { argb: "FF000000" },
  name: "Ink Free",
  family: 4,
  charset: 204,
};

const DIARY_HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF92D050" },
  bgColor: { argb: "FFFFFF00" },
};

const DIARY_HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "medium" },
  left: { style: "medium" },
  bottom: { style: "medium" },
  right: { style: "medium" },
};

const DIARY_HEADER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

const htmlToRichText = (html: string | null | undefined): ExcelJS.RichText[] | string => {
  if (!html) return "";

  // If no HTML tags, return plain string (decoding basic entities if needed)
  if (!html.includes("<")) {
    return html
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
  }

  const parts: ExcelJS.RichText[] = [];

  // Regex to match tags and captures content
  // We handle simple nesting by regex, assuming well-formed input from our own system
  // Matches: <b>...</b> OR <span style="...">...</span> OR <br/>
  // Note: This is a simple parser optimized for the specific format we generate:
  // - <b>text</b>
  // - <span style="color: #RRGGBB;">text</span>
  // - text (plain)
  // - <br/> or \n

  // Actually, a simpler approach for our specific flat structure (likely not deeply nested):
  // We can split by tags and process. But splitting by regex including delimiters is easier.

  // Regex for our expected tags: <b>, </b>, <span style="...">, </span>, <br>
  const tagRegex = /(<b>|<\/b>|<span style="[^"]+">|<\/span>|<br\s*\/?>)/g;

  const tokens = html.split(tagRegex).filter((t) => t !== "");

  // strict simple stack is maybe overkill if we assume local style implies scope, but let's be safe-ish
  const fontStack: Partial<ExcelJS.Font>[] = [{}];

  for (const token of tokens) {
    if (token === "<b>") {
      const newFont = { ...fontStack[fontStack.length - 1], bold: true };
      fontStack.push(newFont);
    } else if (token === "</b>") {
      if (fontStack.length > 1) fontStack.pop();
    } else if (token.startsWith("<span style=")) {
      const match = token.match(/color:\s*(#[0-9a-fA-F]{6})/i);
      const color = match ? match[1] : undefined;
      const newFont = { ...fontStack[fontStack.length - 1] };
      if (color) {
        // exceljs expects argb, usually without #, but let's strip it and prepend FF
        newFont.color = { argb: "FF" + color.replace("#", "").toUpperCase() };
      }
      fontStack.push(newFont);
    } else if (token === "</span>") {
      if (fontStack.length > 1) fontStack.pop();
    } else if (token.match(/^<br\s*\/?>$/)) {
      parts.push({ text: "\n", font: fontStack[fontStack.length - 1] });
    } else {
      // Plain text
      // Decode entities
      const text = token
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');

      if (text) {
        parts.push({ text: text, font: fontStack[fontStack.length - 1] });
      }
    }
  }

  return parts;
};

const isSundayDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getUTCDay() === 0;
};

const applyDiaryHeaderStyle = (sheet: ExcelJS.Worksheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.height = DIARY_HEADER_ROW_HEIGHT;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = DIARY_HEADER_FONT;
    cell.fill = DIARY_HEADER_FILL;
    cell.border = DIARY_HEADER_BORDER;
    cell.alignment = DIARY_HEADER_ALIGNMENT;
  });
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "period";
  const requestedFrom = searchParams.get("from") ?? "";
  const requestedTo = searchParams.get("to") ?? "";
  let from = requestedFrom;
  let to = requestedTo;
  let filenamePrefix = "diary";

  if (scope === "all") {
    const fullRange = await getFullDiaryDateRange({ userId });
    if (!fullRange) {
      return NextResponse.json({ error: "Нет данных для выгрузки" }, { status: 404 });
    }

    from = fullRange.from;
    to = fullRange.to;
    filenamePrefix = "diary_all";
  }

  if (scope !== "all" && scope !== "period") {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const [rows, weeklyVolumeBySunday] = await Promise.all([
    getDiaryExportRows({ userId, from, to }),
    getDiaryWeeklyVolumesBySunday({ userId, from, to }),
  ]);
  const exportDates = buildDateRange(from, to);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Дневник");
  sheet.views = [{ state: "frozen", ySplit: 1, topLeftCell: "A2" }];

  sheet.columns = [
    { header: "Дата, время", key: "dateTime", width: 22 },
    { header: "Задание", key: "task", width: DIARY_TASK_COLUMN_WIDTH },
    { header: "Результат", key: "result", width: 30 },
    { header: "Комментарий", key: "comment", width: 30 },
    { header: "Оценка", key: "score", width: 14 },
    { header: "", key: "empty1", width: 1, hidden: true },
    { header: "", key: "empty2", width: 1, hidden: true },
    { header: "", key: "empty3", width: 1, hidden: true },
    { header: "", key: "empty4", width: 1, hidden: true },
    { header: "Сон", key: "sleep", width: 10 },
    { header: "Вес", key: "weight", width: 14 },
    { header: "Массаж, баня", key: "recovery", width: 20 },
    { header: "Объём", key: "volume", width: 12 },
  ];

  rows.forEach((row, index) => {
    const taskRichText = htmlToRichText(row.task);
    const commentRichText = htmlToRichText(row.comment);

    const rowValues = {
      ...row,
      task: Array.isArray(taskRichText) ? { richText: taskRichText } : taskRichText,
      comment: Array.isArray(commentRichText) ? { richText: commentRichText } : commentRichText,
    };

    const excelRow = sheet.addRow(rowValues);

    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (row.hasWorkload) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDCE6F1" },
        };
      }
    });

    const rowDate = exportDates[index];
    if (rowDate && isSundayDate(rowDate)) {
      const weeklyVolume = weeklyVolumeBySunday.get(rowDate) ?? 0;
      const summaryRowValues = {
        dateTime: "",
        task: "",
        result: "",
        comment: "",
        score: "",
        empty1: "",
        empty2: "",
        empty3: "",
        empty4: "",
        sleep: "",
        weight: "",
        recovery: "",
        volume: `${weeklyVolume.toFixed(2)} км`,
      };
      const summaryRow = sheet.addRow(summaryRowValues);

      summaryRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0070C0" },
        };

        if (colNumber === 13) {
          cell.font = {
            color: { argb: "FFFFFFFF" },
            bold: true,
          };
        }
      });
    }
  });
  sheet.columns?.forEach((column) => {
    column.alignment = { vertical: "top", wrapText: true };
  });
  applyDiaryHeaderStyle(sheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const body = buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer as ArrayLike<number>);
  const filename = `${filenamePrefix}_${from}_${to}.xlsx`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
