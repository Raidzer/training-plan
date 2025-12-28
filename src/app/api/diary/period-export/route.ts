import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getDiaryExportRows, isValidDateString } from "@/lib/diary";

export const runtime = "nodejs";

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
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const rows = await getDiaryExportRows({ userId, from, to });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Дневник");

  sheet.columns = [
    { header: "Дата, время", key: "dateTime", width: 22 },
    { header: "Задание", key: "task", width: 60 },
    { header: "Результат", key: "result", width: 30 },
    { header: "Комментарий", key: "comment", width: 30 },
    { header: "Оценка", key: "score", width: 14 },
    { header: "Сон", key: "sleep", width: 10 },
    { header: "Вес", key: "weight", width: 14 },
    { header: "Массаж, баня", key: "recovery", width: 20 },
    { header: "Объём", key: "volume", width: 12 },
  ];

  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.columns?.forEach((column) => {
    column.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const body =
    buffer instanceof ArrayBuffer
      ? buffer
      : new Uint8Array(buffer as ArrayLike<number>);
  const filename = `diary_${from}_${to}.xlsx`;

  return new NextResponse(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
