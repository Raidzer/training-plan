import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { DEFAULT_TIMEZONE } from "@/shared/constants/timezones";
import { buildDateRange } from "@/shared/utils/diaryUtils";
import {
  getDiaryExportRows,
  getFullDiaryDateRange,
  getDiaryWeeklyVolumesBySunday,
  isValidDateString,
} from "@/server/diary";
import type { CompetitionBlockWithCompetitions } from "@/server/competitions";
import { listCompetitionBlocksByUser } from "@/server/competitions";
import type { PersonalRecord } from "@/server/personalRecords";
import { getPersonalRecords } from "@/server/personalRecords";
import { getUserProfileById } from "@/server/services/users";
import { getLatestWeightEntry } from "@/server/weightEntries";
import { PERSONAL_RECORD_DISTANCES } from "@/shared/constants/personalRecords.constants";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

export const runtime = "nodejs";

const PERSON_SHEET_NAME = "Человек";
const DIARY_SHEET_NAME = "Дневник";
const PERSON_PROFILE_HEADER_ROW_HEIGHT = 84;
const PERSON_DEFAULT_ROW_HEIGHT = 14.25;
const PERSON_RECORD_HEADER_ROW_HEIGHT = 26.25;
const PERSON_RECORD_ROW_HEIGHT = 19.5;
const PERSON_COMPETITION_HEADER_ROW_HEIGHT = 28.5;
const PERSON_COMPETITION_BLOCK_ROW_HEIGHT = 19.5;
const PERSON_COMPETITION_BLOCK_TITLE = "Подготовка";
const DIARY_HEADER_ROW_HEIGHT = 105;
const DIARY_TASK_COLUMN_WIDTH = 101.125;
const EXCEL_DATE_FORMAT = "mm-dd-yy";
const EXCEL_TIME_TEXT_FORMAT = "@";

type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserProfileById>>>;

type PersonSheetData = {
  profile: UserProfile;
  latestWeightKg: string | null;
  personalRecords: PersonalRecord[];
  competitionBlocks: CompetitionBlockWithCompetitions[];
};

const CURRENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: DEFAULT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatCurrentDate = () => CURRENT_DATE_FORMATTER.format(new Date(Date.now()));

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

const PERSON_HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF92D050" },
  bgColor: { argb: "FF92D050" },
};

const PERSON_PROFILE_HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF92D050" },
  bgColor: { argb: "FFFFFF00" },
};

const PERSON_BLUE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF00B0F0" },
  bgColor: { argb: "FF00B0F0" },
};

const PERSON_WHITE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFFFF" },
  bgColor: { argb: "FFFFFFFF" },
};

const PERSON_MAIN_COMPETITION_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
  bgColor: { argb: "FFFFFF00" },
};

const PERSON_HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "medium", color: { argb: "FF000000" } },
  left: { style: "medium", color: { argb: "FF000000" } },
  bottom: { style: "medium", color: { argb: "FF000000" } },
  right: { style: "medium", color: { argb: "FF000000" } },
};

const PERSON_THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const PERSON_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 20,
  color: { argb: "FF000000" },
  name: "Ink Free",
  family: 4,
  charset: 204,
};

const PERSON_BLOCK_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  color: { argb: "FF000000" },
  name: "Ink Free",
  family: 4,
  charset: 204,
};

const PERSON_BODY_FONT: Partial<ExcelJS.Font> = {
  size: 11,
  color: { argb: "FF000000" },
  name: "Calibri",
  family: 2,
  charset: 204,
};

const PERSON_PROFILE_BODY_FONT: Partial<ExcelJS.Font> = {
  size: 11,
  name: "Calibri",
  family: 2,
  charset: 204,
};

const PERSON_COMPETITION_BODY_FONT: Partial<ExcelJS.Font> = {
  size: 11,
  color: { argb: "FF000000" },
  name: "Calibri",
  family: 2,
  charset: 204,
};

const PERSON_PROFILE_COLUMNS = [
  { header: "Фио", key: "fullName", width: 32.875 },
  { header: "Дата рождения", key: "dateOfBirth", width: 79.875 },
  { header: "Рост", key: "heightCm", width: 19.625 },
  { header: "Вес", key: "weightKg", width: 9.375 },
  { header: "Работа/учёба", key: "occupation", width: 23.5 },
  { header: "Количество нагрузок в неделю", key: "weeklyWorkloadCount", width: 29.625 },
  { header: "Разное", key: "miscellaneous", width: 27.875 },
] as const;

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

const toExcelDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date;
};

const formatDisplayDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "";
  }

  return `${day}.${month}.${year}`;
};

const formatPersonName = (profile: UserProfile) => {
  const nameParts = [profile.lastName, profile.name, profile.patronymic].filter((part) => {
    return Boolean(part?.trim());
  });

  return nameParts.join(" ");
};

const formatOccupation = (occupation: string | null) => {
  if (occupation === "work") {
    return "Работа";
  }

  if (occupation === "study") {
    return "Учеба";
  }

  return "";
};

const formatLatestWeight = (value: string | null) => {
  if (!value) {
    return "";
  }

  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return "";
  }

  return parsed;
};

const formatCompetitionName = (
  competition: CompetitionBlockWithCompetitions["competitions"][number]
) => {
  const nameLocation = competition.nameLocation.trim();
  const distanceLabel = competition.distanceLabel.trim();

  if (!distanceLabel) {
    return nameLocation;
  }

  return `${nameLocation}, ${distanceLabel}`;
};

const applyPersonHeaderCellStyle = (cell: ExcelJS.Cell) => {
  cell.font = PERSON_HEADER_FONT;
  cell.fill = PERSON_HEADER_FILL;
  cell.border = PERSON_HEADER_BORDER;
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
};

const applyPersonProfileHeaderCellStyle = (cell: ExcelJS.Cell, columnNumber: number) => {
  cell.font = PERSON_HEADER_FONT;
  cell.fill = PERSON_PROFILE_HEADER_FILL;
  cell.border =
    columnNumber === 6
      ? {
          top: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
        }
      : PERSON_HEADER_BORDER;
  cell.alignment =
    columnNumber === 6
      ? {
          horizontal: "center",
          wrapText: true,
        }
      : {
          horizontal: "center",
        };
};

const applyPersonBodyCellStyle = (cell: ExcelJS.Cell) => {
  cell.font = PERSON_BODY_FONT;
  cell.border = PERSON_THIN_BORDER;
  cell.alignment = {
    horizontal: "left",
    vertical: "middle",
    wrapText: true,
  };
};

const applyPersonProfileBodyCellStyle = (cell: ExcelJS.Cell, columnNumber: number) => {
  cell.font = PERSON_PROFILE_BODY_FONT;
  cell.fill = {
    type: "pattern",
    pattern: "none",
  };
  cell.border = {
    left: {
      style: columnNumber === 1 ? "medium" : "thin",
      color: { indexed: 64 },
    },
    bottom: { style: "thin", color: { indexed: 64 } },
  };

  if (columnNumber !== 6) {
    cell.border.right = { style: "thin", color: { indexed: 64 } };
  }

  cell.alignment =
    columnNumber >= 6
      ? {
          horizontal: "left",
        }
      : {
          horizontal: "left",
          vertical: "middle",
          wrapText: columnNumber === 5,
        };
};

const applyPersonalRecordDistanceStyle = (cell: ExcelJS.Cell) => {
  cell.font = PERSON_BLOCK_FONT;
  cell.fill = PERSON_BLUE_FILL;
  cell.border = PERSON_THIN_BORDER;
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
};

const applyCenteredPersonCellStyle = (cell: ExcelJS.Cell) => {
  cell.font = PERSON_BODY_FONT;
  cell.border = PERSON_THIN_BORDER;
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
};

const applyCompetitionBlockStyle = (cell: ExcelJS.Cell) => {
  cell.font = PERSON_BLOCK_FONT;
  cell.fill = PERSON_BLUE_FILL;
  cell.border = PERSON_THIN_BORDER;
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
};

const applyCompetitionCellStyle = (cell: ExcelJS.Cell, isMainCompetition: boolean) => {
  cell.font = PERSON_COMPETITION_BODY_FONT;
  cell.fill = isMainCompetition ? PERSON_MAIN_COMPETITION_FILL : PERSON_WHITE_FILL;
  cell.border = PERSON_THIN_BORDER;
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
};

const applyPersonRowStyle = (
  row: ExcelJS.Row,
  fromColumn: number,
  toColumn: number,
  handler: (cell: ExcelJS.Cell) => void
) => {
  for (let columnNumber = fromColumn; columnNumber <= toColumn; columnNumber += 1) {
    handler(row.getCell(columnNumber));
  }
};

const addPersonProfileBlock = (sheet: ExcelJS.Worksheet, data: PersonSheetData) => {
  sheet.columns = PERSON_PROFILE_COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = PERSON_PROFILE_HEADER_ROW_HEIGHT;
  PERSON_PROFILE_COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    applyPersonProfileHeaderCellStyle(cell, index + 1);
  });

  const valueRow = sheet.getRow(2);
  valueRow.height = PERSON_DEFAULT_ROW_HEIGHT;
  valueRow.getCell(1).value = formatPersonName(data.profile);
  valueRow.getCell(2).value = toExcelDate(data.profile.dateOfBirth);
  valueRow.getCell(2).numFmt = EXCEL_DATE_FORMAT;
  valueRow.getCell(3).value = data.profile.heightCm ?? "";
  valueRow.getCell(4).value = formatLatestWeight(data.latestWeightKg);
  valueRow.getCell(5).value = formatOccupation(data.profile.occupation ?? null);
  valueRow.getCell(6).value = data.profile.weeklyWorkloadCount ?? "";
  valueRow.getCell(6).numFmt = EXCEL_TIME_TEXT_FORMAT;
  valueRow.getCell(7).value = data.profile.miscellaneous ?? "";
  applyPersonRowStyle(valueRow, 1, PERSON_PROFILE_COLUMNS.length, (cell) => {
    applyPersonProfileBodyCellStyle(cell, cell.col);
  });

  sheet.mergeCells("A3:G3");
  sheet.getRow(3).height = PERSON_DEFAULT_ROW_HEIGHT;
};

const addPersonalRecordsBlock = (sheet: ExcelJS.Worksheet, personalRecords: PersonalRecord[]) => {
  const headerRow = sheet.getRow(4);
  headerRow.height = PERSON_RECORD_HEADER_ROW_HEIGHT;
  headerRow.getCell(1).value = "Личный рекорд";
  headerRow.getCell(2).value = "Дистанция";
  headerRow.getCell(3).value = "Дата";
  applyPersonRowStyle(headerRow, 1, 3, applyPersonHeaderCellStyle);

  const recordsByDistance = new Map(
    personalRecords.map((record) => [record.distanceKey, record] as const)
  );

  PERSONAL_RECORD_DISTANCES.forEach((distance, index) => {
    const row = sheet.getRow(5 + index);
    const record = recordsByDistance.get(distance.key);
    row.height = PERSON_RECORD_ROW_HEIGHT;
    row.getCell(1).value = record?.timeText ?? "";
    row.getCell(1).numFmt = EXCEL_TIME_TEXT_FORMAT;
    row.getCell(2).value = distance.label;
    row.getCell(3).value = formatDisplayDate(record?.recordDate);
    row.getCell(3).numFmt = EXCEL_TIME_TEXT_FORMAT;
    applyCenteredPersonCellStyle(row.getCell(1));
    applyPersonalRecordDistanceStyle(row.getCell(2));
    applyCenteredPersonCellStyle(row.getCell(3));
  });

  sheet.getRow(16).height = PERSON_DEFAULT_ROW_HEIGHT;
};

const addCompetitionsBlock = (
  sheet: ExcelJS.Worksheet,
  competitionBlocks: CompetitionBlockWithCompetitions[]
) => {
  const headerRow = sheet.getRow(17);
  headerRow.height = PERSON_COMPETITION_HEADER_ROW_HEIGHT;
  headerRow.getCell(1).value = "Дата";
  headerRow.getCell(2).value = "Название соревнований(или город) и дистанция";
  headerRow.getCell(3).value = "Результат";
  applyPersonRowStyle(headerRow, 1, 3, applyPersonHeaderCellStyle);

  let rowNumber = 18;

  for (const block of competitionBlocks) {
    sheet.mergeCells(`A${rowNumber}:C${rowNumber}`);
    const blockRow = sheet.getRow(rowNumber);
    blockRow.height = PERSON_COMPETITION_BLOCK_ROW_HEIGHT;
    blockRow.getCell(1).value = PERSON_COMPETITION_BLOCK_TITLE;
    applyPersonRowStyle(blockRow, 1, 3, applyCompetitionBlockStyle);
    rowNumber += 1;

    for (const competition of block.competitions) {
      const row = sheet.getRow(rowNumber);
      const isMainCompetition = competition.priority === COMPETITION_PRIORITIES.MAIN;

      row.height = PERSON_DEFAULT_ROW_HEIGHT;
      row.getCell(1).value = toExcelDate(competition.date);
      row.getCell(1).numFmt = EXCEL_DATE_FORMAT;
      row.getCell(2).value = formatCompetitionName(competition);
      row.getCell(3).value = competition.result ?? "";
      row.getCell(3).numFmt = EXCEL_TIME_TEXT_FORMAT;
      applyPersonRowStyle(row, 1, 3, (cell) => {
        applyCompetitionCellStyle(cell, isMainCompetition);
      });
      rowNumber += 1;
    }
  }
};

const addPersonSheet = (workbook: ExcelJS.Workbook, data: PersonSheetData) => {
  const sheet = workbook.addWorksheet(PERSON_SHEET_NAME);
  sheet.properties.defaultRowHeight = 15;
  sheet.properties.defaultColWidth = 12.625;
  sheet.views = [
    {
      state: "normal",
      showGridLines: true,
      zoomScale: 115,
      zoomScaleNormal: 115,
    },
  ];
  sheet.pageSetup = {
    orientation: "landscape",
    fitToWidth: 1,
    fitToHeight: 1,
  };

  addPersonProfileBlock(sheet, data);
  addPersonalRecordsBlock(sheet, data.personalRecords);
  addCompetitionsBlock(sheet, data.competitionBlocks);
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

    const currentDate = formatCurrentDate();
    from = fullRange.from;
    to = fullRange.to > currentDate ? currentDate : fullRange.to;
    if (from > to) {
      return NextResponse.json({ error: "Нет данных для выгрузки" }, { status: 404 });
    }
    filenamePrefix = "diary_all";
  }

  if (scope !== "all" && scope !== "period") {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const [rows, weeklyVolumeBySunday, profile, personalRecords, competitionBlocks, latestWeightKg] =
    await Promise.all([
      getDiaryExportRows({ userId, from, to }),
      getDiaryWeeklyVolumesBySunday({ userId, from, to }),
      getUserProfileById(userId),
      getPersonalRecords({ userId }),
      listCompetitionBlocksByUser(userId),
      getLatestWeightEntry({ userId }),
    ]);

  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const exportDates = buildDateRange(from, to);

  const workbook = new ExcelJS.Workbook();
  addPersonSheet(workbook, {
    profile,
    latestWeightKg,
    personalRecords,
    competitionBlocks,
  });

  const sheet = workbook.addWorksheet(DIARY_SHEET_NAME);
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
    { header: "Восстановление", key: "recovery", width: 20 },
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
