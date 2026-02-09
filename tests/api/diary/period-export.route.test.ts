import { beforeEach, describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { createRequestWithQuery, createSession, expectJsonError } from "@tests/helpers";

type ExportRowFixture = {
  dateTime: string;
  task: string;
  result: string;
  comment: string;
  score: string;
  sleep: string;
  weight: string;
  recovery: string;
  volume: string;
  hasWorkload: boolean;
};

const {
  authMock,
  getDiaryExportRowsMock,
  getDiaryWeeklyVolumesBySundayMock,
  isValidDateStringMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getDiaryExportRowsMock: vi.fn(),
    getDiaryWeeklyVolumesBySundayMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/diary", () => {
  return {
    getDiaryExportRows: getDiaryExportRowsMock,
    getDiaryWeeklyVolumesBySunday: getDiaryWeeklyVolumesBySundayMock,
    isValidDateString: isValidDateStringMock,
  };
});

import { GET } from "@/app/api/diary/period-export/route";

type WorkbookLoadBuffer = Parameters<ExcelJS.Workbook["xlsx"]["load"]>[0];

const createExportRow = (overrides: Partial<ExportRowFixture> = {}): ExportRowFixture => {
  return {
    dateTime: "01.01.2026(Чт)",
    task: "Тренировка",
    result: "OK",
    comment: "-",
    score: "-",
    sleep: "-",
    weight: "-",
    recovery: "-",
    volume: "1.00",
    hasWorkload: false,
    ...overrides,
  };
};

const loadWorkbookFromResponse = async (response: Response) => {
  const responseBody = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  const workbookBuffer = Buffer.from(responseBody) as unknown as WorkbookLoadBuffer;
  await workbook.xlsx.load(workbookBuffer);
  return workbook;
};

const getStringCellValue = (sheet: ExcelJS.Worksheet, rowNumber: number, columnNumber: number) => {
  const value = sheet.getRow(rowNumber).getCell(columnNumber).value;
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

describe("GET /api/diary/period-export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "9" }));
    isValidDateStringMock.mockReturnValue(true);
    getDiaryExportRowsMock.mockResolvedValue([
      createExportRow({ dateTime: "23.01.2026(Пт)", task: "Легкая", volume: "3.00" }),
      createExportRow({ dateTime: "24.01.2026(Сб)", task: "Средняя", volume: "4.00" }),
      createExportRow({
        dateTime: "25.01.2026(Вс)",
        task: "Длинная",
        volume: "5.00",
        hasWorkload: true,
      }),
    ]);
    getDiaryWeeklyVolumesBySundayMock.mockResolvedValue(new Map([["2026-01-25", 42.5]]));
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном user id", async () => {
    authMock.mockResolvedValue(createSession({ id: "0" }));

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном диапазоне", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-26", to: "2026-01-25" },
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
    expect(getDiaryExportRowsMock).not.toHaveBeenCalled();
    expect(getDiaryWeeklyVolumesBySundayMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 при невалидной дате и не запрашивать серверные данные", async () => {
    isValidDateStringMock.mockReturnValue(false);

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "bad", to: "2026-01-25" },
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
    expect(getDiaryExportRowsMock).not.toHaveBeenCalled();
    expect(getDiaryWeeklyVolumesBySundayMock).not.toHaveBeenCalled();
  });

  it("должен выставлять корректное имя файла в content-disposition", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="diary_2026-01-23_2026-01-25.xlsx"'
    );
  });

  it("должен указывать полный недельный объем в синей строке при частичном диапазоне", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(getDiaryExportRowsMock).toHaveBeenCalledWith({
      userId: 9,
      from: "2026-01-23",
      to: "2026-01-25",
    });
    expect(getDiaryWeeklyVolumesBySundayMock).toHaveBeenCalledWith({
      userId: 9,
      from: "2026-01-23",
      to: "2026-01-25",
    });

    const workbook = await loadWorkbookFromResponse(response);
    const sheet = workbook.getWorksheet(1);

    expect(sheet).toBeTruthy();
    if (!sheet) {
      return;
    }

    expect(getStringCellValue(sheet, 5, 13)).toBe("42.50 км");
    expect(getStringCellValue(sheet, 5, 13)).not.toBe("12.00 км");
  });

  it("должен добавлять синюю строку по календарному воскресенью, даже если текст дня ошибочный", async () => {
    getDiaryExportRowsMock.mockResolvedValue([
      createExportRow({ dateTime: "23.01.2026(Пт)", volume: "3.00" }),
      createExportRow({ dateTime: "24.01.2026(Сб)", volume: "4.00" }),
      createExportRow({ dateTime: "25.01.2026(Пн)", volume: "5.00" }),
    ]);
    getDiaryWeeklyVolumesBySundayMock.mockResolvedValue(new Map([["2026-01-25", 33.33]]));

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);

    const sheet = workbook.getWorksheet(1);
    expect(sheet).toBeTruthy();
    if (!sheet) {
      return;
    }

    expect(sheet.rowCount).toBe(5);
    expect(getStringCellValue(sheet, 5, 13)).toBe("33.33 км");
  });

  it("не должен добавлять синюю строку, если в диапазоне нет воскресенья", async () => {
    getDiaryExportRowsMock.mockResolvedValue([
      createExportRow({ dateTime: "23.01.2026(Пт)", volume: "3.00" }),
      createExportRow({ dateTime: "24.01.2026(Сб)", volume: "4.00" }),
    ]);
    getDiaryWeeklyVolumesBySundayMock.mockResolvedValue(new Map<string, number>());

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-24" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);

    const sheet = workbook.getWorksheet(1);
    expect(sheet).toBeTruthy();
    if (!sheet) {
      return;
    }

    expect(sheet.rowCount).toBe(3);
    expect(getStringCellValue(sheet, 3, 13)).toBe("4.00");
  });

  it("должен подставлять 0.00 км, если для воскресенья нет недельного объема", async () => {
    getDiaryWeeklyVolumesBySundayMock.mockResolvedValue(new Map<string, number>());

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);

    const sheet = workbook.getWorksheet(1);
    expect(sheet).toBeTruthy();
    if (!sheet) {
      return;
    }

    expect(getStringCellValue(sheet, 5, 13)).toBe("0.00 км");
  });

  it("должен добавлять отдельную синюю строку для каждого воскресенья в диапазоне", async () => {
    getDiaryExportRowsMock.mockResolvedValue([
      createExportRow({ dateTime: "25.01.2026(Вс)", volume: "10.00" }),
      createExportRow({ dateTime: "26.01.2026(Пн)", volume: "1.00" }),
      createExportRow({ dateTime: "27.01.2026(Вт)", volume: "1.00" }),
      createExportRow({ dateTime: "28.01.2026(Ср)", volume: "1.00" }),
      createExportRow({ dateTime: "29.01.2026(Чт)", volume: "1.00" }),
      createExportRow({ dateTime: "30.01.2026(Пт)", volume: "1.00" }),
      createExportRow({ dateTime: "31.01.2026(Сб)", volume: "1.00" }),
      createExportRow({ dateTime: "01.02.2026(Вс)", volume: "5.00" }),
    ]);
    getDiaryWeeklyVolumesBySundayMock.mockResolvedValue(
      new Map([
        ["2026-01-25", 55.55],
        ["2026-02-01", 66.66],
      ])
    );

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-25", to: "2026-02-01" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);

    const sheet = workbook.getWorksheet(1);
    expect(sheet).toBeTruthy();
    if (!sheet) {
      return;
    }

    expect(sheet.rowCount).toBe(11);
    expect(getStringCellValue(sheet, 3, 13)).toBe("55.55 км");
    expect(getStringCellValue(sheet, 11, 13)).toBe("66.66 км");
  });
});
