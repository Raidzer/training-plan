import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseDiaryWorkbook } from "@/server/diaryImportParser";

async function writeWorkbookBuffer(workbook: ExcelJS.Workbook): Promise<ArrayBuffer> {
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

function addDiaryHeader(sheet: ExcelJS.Worksheet) {
  sheet.addRow([
    "Дата",
    "Задание",
    "Результат",
    "Комментарий",
    "Оценка",
    "Сон(с момента закрывания глаз до момента открывания глаз)",
    "Вес(сразу после сна,сразу перед сном)",
    "Объём",
    "утр. пульс",
    "Сон",
    "Вес",
    "Массаж,баня",
    "Объём",
  ]);
}

describe("parseDiaryWorkbook", () => {
  it("должен выбирать лист, который начинается с Дневник, и парсить дневниковые поля", async () => {
    const workbook = new ExcelJS.Workbook();
    const exampleSheet = workbook.addWorksheet("Пример дневника и отчёта");
    addDiaryHeader(exampleSheet);
    exampleSheet.addRow(["01.01.2026(Чт)", "Пример"]);

    const diarySheet = workbook.addWorksheet("Дневник(2026)");
    addDiaryHeader(diarySheet);
    diarySheet.addRow([
      "01.02.2026(Вс)\n\n07:30",
      "10 км(до 22)(пульс)",
      "Б=5:00\n10 км: 50:00",
      "Бежалось хорошо",
      "8-9-7",
      "",
      "",
      "",
      "",
      "07:30",
      "70,1; 69,8",
      "мфр, баня",
      "10,25 км",
    ]);

    const result = await parseDiaryWorkbook(await writeWorkbookBuffer(workbook));

    expect(result.sheetName).toBe("Дневник(2026)");
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      rowNumber: 2,
      sessionOrder: 1,
      date: "2026-02-01",
      startTime: "07:30",
      taskText: "10 км(до 22)(пульс)",
      resultText: "Б=5:00\n10 км: 50:00",
      commentText: "Бежалось хорошо",
      distanceKm: 10.25,
      overallScore: 8,
      functionalScore: 9,
      muscleScore: 7,
      sleepHours: 7.5,
      morningWeightKg: 70.1,
      eveningWeightKg: 69.8,
      hasBath: true,
      hasMfr: true,
      hasMassage: false,
    });
  });

  it("должен предупреждать о несовпадении дня недели и пропускать недельные строки без даты", async () => {
    const workbook = new ExcelJS.Workbook();
    const diarySheet = workbook.addWorksheet("Дневник 2026");
    addDiaryHeader(diarySheet);
    diarySheet.addRow([
      "01.02.2026(Пн)\n\n07:30",
      "10 км",
      "10 км: 50:00",
      "",
      "8-9-7",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "10 км",
    ]);
    diarySheet.addRow(["", "", "", "", "", "", "", "", "", "", "", "", "70 км"]);
    diarySheet.addRow(["", "Есть текст без даты"]);

    const result = await parseDiaryWorkbook(await writeWorkbookBuffer(workbook));

    expect(result.rows).toHaveLength(1);
    expect(result.warnings).toEqual([
      {
        row: 2,
        message: "Дата 2026-02-01 не соответствует дню недели «Пн».",
      },
    ]);
    expect(result.errors).toEqual([{ row: 4, message: "Некорректная дата" }]);
  });

  it("должен распознавать время старта без пробела и в скобках", async () => {
    const workbook = new ExcelJS.Workbook();
    const diarySheet = workbook.addWorksheet("Дневник 2026");
    addDiaryHeader(diarySheet);
    diarySheet.addRow(["01.02.2026(Вс)07:30", "10 км"]);
    diarySheet.addRow(["02.02.2026(Пн)(8:05)", "8 км"]);
    diarySheet.addRow(["03.02.2026(Вт) (19:45)", "12 км"]);

    const result = await parseDiaryWorkbook(await writeWorkbookBuffer(workbook));

    expect(result.errors).toEqual([]);
    expect(result.rows.map((row) => row.startTime)).toEqual(["07:30", "08:05", "19:45"]);
  });

  it("должен распознавать оценку тренировки с разными разделителями", async () => {
    const workbook = new ExcelJS.Workbook();
    const diarySheet = workbook.addWorksheet("Дневник 2026");
    addDiaryHeader(diarySheet);
    diarySheet.addRow(["01.02.2026(Вс)", "10 км", "", "", "9 - 9  - 9"]);
    diarySheet.addRow(["02.02.2026(Пн)", "8 км", "", "", "8/7/6"]);
    diarySheet.addRow(["03.02.2026(Вт)", "12 км", "", "", "10 | 9 | 8"]);
    diarySheet.addRow(["04.02.2026(Ср)", "6 км", "", "", "7 6 5"]);
    diarySheet.addRow(["05.02.2026(Чт)", "6 км", "", "", "7—6—5"]);

    const result = await parseDiaryWorkbook(await writeWorkbookBuffer(workbook));

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(
      result.rows.map((row) => [row.overallScore, row.functionalScore, row.muscleScore])
    ).toEqual([
      [9, 9, 9],
      [8, 7, 6],
      [10, 9, 8],
      [7, 6, 5],
      [7, 6, 5],
    ]);
  });

  it("должен распознавать колонку восстановления по заголовку Восстановление", async () => {
    const workbook = new ExcelJS.Workbook();
    const diarySheet = workbook.addWorksheet("Дневник 2026");
    diarySheet.addRow([
      "Дата",
      "Задание",
      "Результат",
      "Комментарий",
      "Оценка",
      "Сон",
      "Вес",
      "Восстановление",
    ]);
    diarySheet.addRow(["01.02.2026(Вс)", "10 км", "", "", "", "07:30", "70.1", "баня, мфр"]);

    const result = await parseDiaryWorkbook(await writeWorkbookBuffer(workbook));

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      sleepHours: 7.5,
      morningWeightKg: 70.1,
      hasBath: true,
      hasMfr: true,
      hasMassage: false,
    });
  });

  it("должен возвращать понятную ошибку, если лист дневника отсутствует", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("План");
    addDiaryHeader(sheet);

    await expect(parseDiaryWorkbook(await writeWorkbookBuffer(workbook))).rejects.toThrow(
      "Не найден лист дневника"
    );
  });
});
