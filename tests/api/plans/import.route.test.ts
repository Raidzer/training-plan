import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const {
  authMock,
  createPlanImportMock,
  getExistingPlanEntryDatesMock,
  getLatestPlanEntryDateMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    createPlanImportMock: vi.fn(),
    getExistingPlanEntryDatesMock: vi.fn(),
    getLatestPlanEntryDateMock: vi.fn(),
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
    getLatestPlanEntryDate: getLatestPlanEntryDateMock,
  };
});

import { POST } from "@/app/api/plans/import/route";

async function createWorkbookBuffer(params: {
  headers?: string[];
  rows: Array<{
    date: string | number | Date;
    task: string;
    comment?: string;
    taskHasFill?: boolean;
  }>;
}): Promise<ArrayBuffer> {
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
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }

  const view = buffer as Uint8Array;
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

function createImportRequest(fileBuffer?: ArrayBuffer, filename = "plan-import.xlsx"): Request {
  let file: (Blob & { name?: string; arrayBuffer?: () => Promise<ArrayBuffer> }) | null = null;
  if (fileBuffer) {
    file = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }) as Blob & { name?: string; arrayBuffer?: () => Promise<ArrayBuffer> };
    file.name = filename;
    file.arrayBuffer = async () => fileBuffer;
  }

  const requestStub = {
    formData: async () => ({
      get: (key: string) => (key === "file" ? file : null),
    }),
  };
  return requestStub as unknown as Request;
}

describe("POST /api/plans/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "21" }));
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set<string>());
    getLatestPlanEntryDateMock.mockResolvedValue(null);
    createPlanImportMock.mockResolvedValue({ id: 88, insertedCount: 2 });
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
    const payload = await readJsonResponse<{ error: string }>(response);

    expect(payload.error).toContain("Не найдены колонки");
  });

  it("должен возвращать 400, когда даты непоследовательны", async () => {
    const buffer = await createWorkbookBuffer({
      rows: [
        { date: "01.01.2026", task: "Run" },
        { date: "03.01.2026", task: "Bike" },
      ],
    });

    const response = await POST(createImportRequest(buffer));
    expect(response.status).toBe(400);
    const payload = await readJsonResponse<{ error: string }>(response);

    expect(payload.error).toContain("даты должны идти подряд");
  });

  it("должен возвращать 400, когда импортируемый диапазон не продолжает существующий план", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set<string>());
    getLatestPlanEntryDateMock.mockResolvedValue("2026-01-01");
    const buffer = await createWorkbookBuffer({
      rows: [{ date: "03.01.2026", task: "Run" }],
    });

    const response = await POST(createImportRequest(buffer));
    expect(response.status).toBe(400);
    const payload = await readJsonResponse<{ error: string }>(response);

    expect(payload.error).toContain("новые даты должны начинаться");
  });

  it("должен парсить workbook и создавать сводку импорта", async () => {
    getExistingPlanEntryDatesMock.mockResolvedValue(new Set(["2026-01-01"]));
    getLatestPlanEntryDateMock.mockResolvedValue("2026-01-01");
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

    expect(payload).toEqual({
      importId: 77,
      inserted: 1,
      skipped: 1,
      errors: [],
    });

    expect(getExistingPlanEntryDatesMock).toHaveBeenCalledWith(21, ["2026-01-01", "2026-01-02"]);
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
      newEntries: Array<{ date: string; sessionOrder: number }>;
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
    expect(importArg.newEntries).toEqual([
      expect.objectContaining({
        date: "2026-01-02",
        sessionOrder: 1,
      }),
    ]);
  });
});
