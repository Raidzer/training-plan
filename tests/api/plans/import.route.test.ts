import ExcelJS from "exceljs";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const { authMock, createPlanImportMock, getExistingPlanEntryDatesMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    createPlanImportMock: vi.fn(),
    getExistingPlanEntryDatesMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/planImports", () => {
  return {
    createPlanImport: createPlanImportMock,
    getExistingPlanEntryDates: getExistingPlanEntryDatesMock,
  };
});

import { POST } from "@/app/api/plans/import/route";
import { MAX_SPREADSHEET_FILE_BYTES } from "@/server/spreadsheetLimits";

async function createWorkbookBuffer(params: {
  headers?: string[];
  rows: Array<{
    date: string | number | Date;
    task: string;
    comment?: string;
    taskHasFill?: boolean;
  }>;
}): Promise<ArrayBuffer | Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Plan");
  sheet.addRow(params.headers ?? ["Дата", "Задание", "Комментарий"]);

  for (const row of params.rows) {
    const added = sheet.addRow([row.date, row.task, row.comment ?? ""]);
    if (row.taskHasFill) {
      added.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCE6F1" },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer as ArrayLike<number>);
}

async function writeWorkbookBuffer(workbook: ExcelJS.Workbook): Promise<ArrayBuffer | Uint8Array> {
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer as ArrayLike<number>);
}

function createImportRequest(
  fileBuffer?: ArrayBuffer | Uint8Array,
  filename: string | null = "plan-import.xlsx"
): Request {
  const body = new Blob(
    fileBuffer
      ? [
          `--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="${filename ?? "plan.xlsx"}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
          fileBuffer as BlobPart,
          "\r\n--test-boundary--\r\n",
        ]
      : ["--test-boundary--\r\n"]
  );
  return new Request("http://localhost/api/plans/import", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test-boundary" },
    body,
  });
}

describe("POST /api/plans/import", () => {
  beforeEach(() => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("File", NodeFile);
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "21" }));
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set<string>());
    createPlanImportMock.mockResolvedValue({ id: 88, insertedCount: 2 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("возвращает 413 без записи при превышении размера файла", async () => {
    const response = await POST(
      createImportRequest(new ArrayBuffer(MAX_SPREADSHEET_FILE_BYTES + 1))
    );
    await expectJsonError(response, 413, "Файл слишком большой. Максимальный размер — 10 МиБ");
    expect(createPlanImportMock).not.toHaveBeenCalled();
  });

  it("ограничивает число строк листа до разбора всех записей", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Plan");
    sheet.addRow(["Дата", "Задание"]);
    sheet.getRow(10_002).values = ["01.01.2026", "Run"];
    const response = await POST(createImportRequest(await writeWorkbookBuffer(workbook)));
    await expectJsonError(
      response,
      400,
      "Файл содержит больше 10 000 строк. Разделите его на части"
    );
    expect(createPlanImportMock).not.toHaveBeenCalled();
  });

  it("ограничивает число тренировок после разделения строки", async () => {
    const tasks = Array.from({ length: 10_001 }, (_, index) => `${index + 1}) Run`).join("\n");
    const buffer = await createWorkbookBuffer({ rows: [{ date: "01.01.2026", task: tasks }] });
    const response = await POST(createImportRequest(buffer));
    await expectJsonError(
      response,
      400,
      "Файл содержит больше 10 000 строк. Разделите его на части"
    );
    expect(createPlanImportMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(createImportRequest());

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя", async () => {
    authMock.mockResolvedValue(createSession({ id: "0" }));

    const response = await POST(createImportRequest());

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 когда поле файл отсутствует", async () => {
    const response = await POST(createImportRequest());

    await expectJsonError(response, 400, "Не найден файл в поле file");
  });

  it("должен возвращать 400 при невалидных заголовках workbook", async () => {
    const buffer = await createWorkbookBuffer({
      headers: ["Foo", "Bar", "Baz"],
      rows: [{ date: "01.01.2026", task: "Run", comment: "ok" }],
    });

    const response = await POST(createImportRequest(buffer));
    expect(response.status).toBe(400);
    const payload = await readJsonResponse<{
      error: string;
      details: string[];
      foundHeaders: string[];
      sheetName: string;
    }>(response);

    expect(payload.error).toContain("Не найдены колонки");
    expect(payload.details).toContain("Не найдены колонки: Дата, Задание.");
    expect(payload.foundHeaders).toEqual(["1: Foo", "2: Bar", "3: Baz"]);
    expect(payload.sheetName).toBe("Plan");
  });

  it("должен возвращать понятную ошибку для старого формата xls", async () => {
    const response = await POST(createImportRequest(new ArrayBuffer(8), "plan.xls"));
    const payload = await readJsonResponse<{ error: string; details: string[] }>(response);

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Формат .xls не поддерживается для импорта плана.");
    expect(payload.details[0]).toContain(".xlsx");
  });

  it("должен импортировать план с разрывом между датами", async () => {
    createPlanImportMock.mockResolvedValue({ id: 90, insertedCount: 2 });
    const buffer = await createWorkbookBuffer({
      rows: [
        { date: "01.01.2026", task: "Run" },
        { date: "03.01.2026", task: "Bike" },
      ],
    });

    const response = await POST(createImportRequest(buffer));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 90,
      inserted: 2,
      skipped: 0,
      errors: [],
    });
  });

  it("должен возвращать 400, когда даты идут не по порядку", async () => {
    const buffer = await createWorkbookBuffer({
      rows: [
        { date: "03.01.2026", task: "Bike" },
        { date: "01.01.2026", task: "Run" },
      ],
    });

    const response = await POST(createImportRequest(buffer));
    expect(response.status).toBe(400);
    const payload = await readJsonResponse<{ error: string; details: string[] }>(response);

    expect(payload.error).toContain("даты должны идти по порядку");
    expect(payload.details[0]).toContain("Строка 3");
  });

  it("должен возвращать 400, когда workbook не содержит валидных строк", async () => {
    const buffer = await createWorkbookBuffer({
      rows: [],
    });

    const response = await POST(createImportRequest(buffer));

    await expectJsonError(response, 400, "Файл пуст или не содержит валидных строк");
  });

  it("должен включать ошибки строк в сводку импорта", async () => {
    createPlanImportMock.mockResolvedValue({ id: 99, insertedCount: 1 });
    const buffer = await createWorkbookBuffer({
      rows: [
        { date: "", task: "Нет даты" },
        { date: "02.01.2026", task: "" },
        { date: "01.01.2026", task: "Run" },
      ],
    });

    const response = await POST(createImportRequest(buffer));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 99,
      inserted: 1,
      skipped: 2,
      errors: [
        { row: 2, message: "Некорректная дата" },
        { row: 3, message: "Пустое задание" },
      ],
    });
    expect(createPlanImportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rowCount: 1,
        errorsCount: 2,
      })
    );
  });

  it("должен разрешать разрыв после последней даты существующего плана", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set<string>());
    createPlanImportMock.mockResolvedValue({ id: 91, insertedCount: 1 });
    const buffer = await createWorkbookBuffer({
      rows: [{ date: "03.01.2026", task: "Run" }],
    });

    const response = await POST(createImportRequest(buffer));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 91,
      inserted: 1,
      skipped: 0,
    });
  });

  it("должен импортировать отсутствующую дату внутри текущего диапазона плана", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set<string>());
    createPlanImportMock.mockResolvedValue({ id: 92, insertedCount: 1 });
    const buffer = await createWorkbookBuffer({
      rows: [{ date: "05.01.2026", task: "Run" }],
    });

    const response = await POST(createImportRequest(buffer));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
      warnings?: Array<{ row: number; message: string }>;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 92,
      inserted: 1,
      skipped: 0,
      errors: [],
    });
    expect(payload.warnings).toBeUndefined();
  });

  it("передаёт все даты сервису для проверки внутри транзакции", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set(["2026-01-05", "2026-01-09"]));
    createPlanImportMock.mockResolvedValue({ id: 93, insertedCount: 1 });
    const buffer = await createWorkbookBuffer({
      rows: [
        { date: "05.01.2026", task: "Старая дата вне БД, но внутри диапазона" },
        { date: "09.01.2026", task: "Существующая дата" },
        { date: "15.01.2026", task: "Новая дата" },
      ],
    });

    const response = await POST(createImportRequest(buffer));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 93,
      inserted: 1,
      skipped: 2,
      errors: [],
    });

    const importArg = createPlanImportMock.mock.calls[0][0] as {
      entries: Array<{ date: string; taskText: string }>;
    };
    expect(importArg.entries.map((entry) => entry.date)).toEqual([
      "2026-01-05",
      "2026-01-09",
      "2026-01-15",
    ]);
    expect(getExistingPlanEntryDatesMock).not.toHaveBeenCalled();
  });

  it("должен парсить числовую дату, формулу и файл без колонки комментария", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Plan");
    const excelEpoch = Date.UTC(1899, 11, 30);
    const dateSerial = (Date.UTC(2026, 0, 1) - excelEpoch) / (24 * 60 * 60 * 1000);

    sheet.addRow(["date", "workout"]);
    const row = sheet.addRow([dateSerial, ""]);
    row.getCell(2).value = { formula: "1+1", result: "Run from formula" } as any;

    const response = await POST(createImportRequest(await writeWorkbookBuffer(workbook)));

    await expectJsonSuccess(response, 200);

    const importArg = createPlanImportMock.mock.calls[0][0] as {
      entries: Array<{ date: string; taskText: string; commentText: string | null }>;
    };
    expect(importArg.entries).toEqual([
      expect.objectContaining({
        date: "2026-01-01",
        taskText: "Run from formula",
        commentText: null,
      }),
    ]);
  });

  it("должен разделять rich text с нумерованными тренировками и комментариями", async () => {
    createPlanImportMock.mockResolvedValue({ id: 55, insertedCount: 2 });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Plan");
    sheet.addRow(["Дата", "Задание", "Комментарий"]);
    const row = sheet.addRow([new Date(Date.UTC(2026, 0, 1)), "", ""]);

    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00FF00" },
    } as any;
    row.getCell(2).value = {
      richText: [
        {
          font: {
            bold: true,
            color: { argb: "80FF0000" },
          },
          text: "1) Быстрый <кросс>\n",
        },
        {
          text: "2) Заминка",
        },
      ],
    } as any;
    row.getCell(3).value = "1) Тяжело\n2) Легко";

    const response = await POST(createImportRequest(await writeWorkbookBuffer(workbook)));

    await expectJsonSuccess(response, 200);

    const importArg = createPlanImportMock.mock.calls[0][0] as {
      entries: Array<{
        date: string;
        sessionOrder: number;
        taskText: string;
        commentText: string | null;
        isWorkload: boolean;
      }>;
    };
    expect(importArg.entries).toHaveLength(2);
    expect(importArg.entries[0]).toEqual(
      expect.objectContaining({
        date: "2026-01-01",
        sessionOrder: 1,
        commentText: "Тяжело",
        isWorkload: true,
      })
    );
    expect(importArg.entries[0].taskText).toContain("Быстрый");
    expect(importArg.entries[0].taskText).toContain("&lt;кросс&gt;");
    expect(importArg.entries[1]).toEqual(
      expect.objectContaining({
        sessionOrder: 2,
        taskText: "Заминка",
        commentText: "Легко",
        isWorkload: true,
      })
    );
  });

  it("должен объединять префикс, общий комментарий и считать gradient fill нагрузкой", async () => {
    createPlanImportMock.mockResolvedValue({ id: 56, insertedCount: 2 });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Plan");
    sheet.addRow(["Дата", "Задание", "Комментарий"]);
    const row = sheet.addRow([
      "02.01.2026",
      "Разминка\n1) Основная работа\n2) Заминка",
      "общий комментарий",
    ]);

    row.getCell(3).fill = {
      type: "gradient",
      gradient: "angle",
      degree: 0,
      stops: [
        {
          position: 0,
          color: { argb: "FFDCE6F1" },
        },
      ],
    } as any;

    const response = await POST(createImportRequest(await writeWorkbookBuffer(workbook)));

    await expectJsonSuccess(response, 200);

    const importArg = createPlanImportMock.mock.calls[0][0] as {
      entries: Array<{
        taskText: string;
        commentText: string | null;
        isWorkload: boolean;
      }>;
    };
    expect(importArg.entries).toEqual([
      expect.objectContaining({
        taskText: "Разминка Основная работа",
        commentText: "общий комментарий",
        isWorkload: true,
      }),
      expect.objectContaining({
        taskText: "Заминка",
        commentText: "общий комментарий",
        isWorkload: true,
      }),
    ]);
  });

  it("должен сохранять rich text стили после удаления нумерованного префикса", async () => {
    createPlanImportMock.mockResolvedValue({ id: 57, insertedCount: 1 });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Plan");
    sheet.addRow(["Дата", "Задание"]);
    const row = sheet.addRow(["03.01.2026", ""]);
    row.getCell(2).value = {
      richText: [
        {
          font: {
            bold: true,
            color: { argb: "FF00AA11" },
          },
          text: "1) Цветная работа",
        },
      ],
    } as any;

    const response = await POST(createImportRequest(await writeWorkbookBuffer(workbook)));

    await expectJsonSuccess(response, 200);

    const importArg = createPlanImportMock.mock.calls[0][0] as {
      entries: Array<{ taskText: string }>;
    };
    expect(importArg.entries[0].taskText).toContain("Цветная работа");
    expect(importArg.entries[0].taskText).toContain("font-weight: bold;");
    expect(importArg.entries[0].taskText).toContain("color: #00AA11;");
  });

  it("должен создавать импорт без новых записей, если все даты уже существуют", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set(["2026-01-04"]));
    createPlanImportMock.mockResolvedValue({ id: 58, insertedCount: 0 });
    const buffer = await createWorkbookBuffer({
      rows: [{ date: "04.01.2026", task: "Существующий день" }],
    });

    const response = await POST(createImportRequest(buffer, null));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 58,
      inserted: 0,
      skipped: 1,
      errors: [],
    });
    expect(payload).not.toHaveProperty("warnings");
    expect(createPlanImportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "plan.xlsx",
        entries: [expect.objectContaining({ date: "2026-01-04" })],
      })
    );
  });

  it("должен парсить workbook и создавать сводку импорта", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set(["2026-01-01"]));
    createPlanImportMock.mockResolvedValue({ id: 77, insertedCount: 1 });

    const buffer = await createWorkbookBuffer({
      rows: [
        { date: "01.01.2026", task: "Интервалы", comment: "Тяжело", taskHasFill: true },
        { date: "02.01.2026", task: "Восстановление", comment: "Легко" },
      ],
    });

    const response = await POST(createImportRequest(buffer, "block-1.xlsx"));
    const payload = await expectJsonSuccess<{
      importId: number;
      inserted: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>(response, 200);

    expect(payload).toMatchObject({
      importId: 77,
      inserted: 1,
      skipped: 1,
      errors: [],
    });
    expect(payload).not.toHaveProperty("warnings");

    expect(getExistingPlanEntryDatesMock).not.toHaveBeenCalled();
    expect(createPlanImportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 21,
        filename: "block-1.xlsx",
        rowCount: 2,
        errorsCount: 0,
      })
    );

    const importArg = createPlanImportMock.mock.calls[0][0] as {
      entries: Array<{ date: string; sessionOrder: number; isWorkload: boolean }>;
    };
    expect(importArg.entries).toHaveLength(2);
    expect(importArg.entries[0]).toMatchObject({
      date: "2026-01-01",
      sessionOrder: 1,
      isWorkload: true,
    });
    expect(importArg.entries[1]).toMatchObject({
      date: "2026-01-02",
      sessionOrder: 1,
      isWorkload: false,
    });
  });
});
