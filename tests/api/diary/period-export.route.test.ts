import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  getFullDiaryDateRangeMock,
  getDiaryWeeklyVolumesBySundayMock,
  getLatestWeightEntryMock,
  getPersonalRecordsMock,
  getUserProfileByIdMock,
  isValidDateStringMock,
  listCompetitionBlocksByUserMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getDiaryExportRowsMock: vi.fn(),
    getFullDiaryDateRangeMock: vi.fn(),
    getDiaryWeeklyVolumesBySundayMock: vi.fn(),
    getLatestWeightEntryMock: vi.fn(),
    getPersonalRecordsMock: vi.fn(),
    getUserProfileByIdMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    listCompetitionBlocksByUserMock: vi.fn(),
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
    getFullDiaryDateRange: getFullDiaryDateRangeMock,
    getDiaryWeeklyVolumesBySunday: getDiaryWeeklyVolumesBySundayMock,
    isValidDateString: isValidDateStringMock,
  };
});

vi.mock("@/server/services/users", () => {
  return {
    getUserProfileById: getUserProfileByIdMock,
  };
});

vi.mock("@/server/personalRecords", () => {
  return {
    getPersonalRecords: getPersonalRecordsMock,
  };
});

vi.mock("@/server/competitions", () => {
  return {
    listCompetitionBlocksByUser: listCompetitionBlocksByUserMock,
  };
});

vi.mock("@/server/weightEntries", () => {
  return {
    getLatestWeightEntry: getLatestWeightEntryMock,
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

const getRequiredWorksheet = (workbook: ExcelJS.Workbook, sheetName: string) => {
  const sheet = workbook.getWorksheet(sheetName);
  expect(sheet).toBeTruthy();

  if (!sheet) {
    throw new Error(`Лист ${sheetName} не найден`);
  }

  return sheet;
};

describe("GET /api/diary/period-export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-06-14T12:00:00.000Z").getTime());
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
    getFullDiaryDateRangeMock.mockResolvedValue({
      from: "2025-10-13",
      to: "2026-06-15",
    });
    getUserProfileByIdMock.mockResolvedValue({
      id: 9,
      email: "runner@example.com",
      login: "runner",
      name: "Иван",
      lastName: "Петров",
      patronymic: "Сергеевич",
      heightCm: 180,
      gender: "male",
      dateOfBirth: "1990-02-03",
      occupation: "work",
      timezone: "Europe/Moscow",
      role: "athlete",
    });
    getLatestWeightEntryMock.mockResolvedValue("70.5");
    getPersonalRecordsMock.mockResolvedValue([
      {
        distanceKey: "10k",
        timeText: "37:32",
        recordDate: "2026-05-23",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
    ]);
    listCompetitionBlocksByUserMock.mockResolvedValue([
      {
        id: 1,
        title: "Весна 2026",
        startDate: "2026-04-01",
        endDate: "2026-05-31",
        sortOrder: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        competitions: [
          {
            id: 11,
            blockId: 1,
            date: "2026-04-26",
            nameLocation: "Москва",
            distanceMeters: 21100,
            distanceLabel: "21.1 км",
            priority: "main",
            result: "1:21:16",
            sortOrder: 0,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ],
      },
      {
        id: 2,
        title: "Осень 2026",
        startDate: "2026-06-01",
        endDate: "2026-09-30",
        sortOrder: 1,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        competitions: [
          {
            id: 12,
            blockId: 2,
            date: "2026-09-26",
            nameLocation: "Московский марафон",
            distanceMeters: 10000,
            distanceLabel: "10 км",
            priority: "regular",
            result: null,
            sortOrder: 0,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("должен возвращать 400 при неизвестном режиме выгрузки", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { scope: "bad", from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_scope");
    expect(getFullDiaryDateRangeMock).not.toHaveBeenCalled();
    expect(getDiaryExportRowsMock).not.toHaveBeenCalled();
    expect(getDiaryWeeklyVolumesBySundayMock).not.toHaveBeenCalled();
  });

  it("должен выгружать весь дневник по диапазону плана до текущей даты", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { scope: "all" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="diary_all_2025-10-13_2026-06-14.xlsx"'
    );
    expect(getFullDiaryDateRangeMock).toHaveBeenCalledWith({ userId: 9 });
    expect(getDiaryExportRowsMock).toHaveBeenCalledWith({
      userId: 9,
      from: "2025-10-13",
      to: "2026-06-14",
    });
    expect(getDiaryWeeklyVolumesBySundayMock).toHaveBeenCalledWith({
      userId: 9,
      from: "2025-10-13",
      to: "2026-06-14",
    });
  });

  it("должен возвращать 404 при выгрузке всего дневника, если план начинается в будущем", async () => {
    getFullDiaryDateRangeMock.mockResolvedValue({
      from: "2026-06-15",
      to: "2026-07-01",
    });

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { scope: "all" },
    });
    const response = await GET(request);

    await expectJsonError(response, 404, "Нет данных для выгрузки");
    expect(getDiaryExportRowsMock).not.toHaveBeenCalled();
    expect(getDiaryWeeklyVolumesBySundayMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 404 при выгрузке всего дневника без данных", async () => {
    getFullDiaryDateRangeMock.mockResolvedValue(null);

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { scope: "all" },
    });
    const response = await GET(request);

    await expectJsonError(response, 404, "Нет данных для выгрузки");
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

  it("должен формировать лист Человек первым с профилем, рекордами и соревнованиями", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);
    const personSheet = getRequiredWorksheet(workbook, "Человек");

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Человек", "Дневник"]);
    expect(getUserProfileByIdMock).toHaveBeenCalledWith(9);
    expect(getLatestWeightEntryMock).toHaveBeenCalledWith({ userId: 9 });
    expect(getPersonalRecordsMock).toHaveBeenCalledWith({ userId: 9 });
    expect(listCompetitionBlocksByUserMock).toHaveBeenCalledWith(9);

    const profileHeaders = [1, 2, 3, 4, 5, 6, 7].map((columnNumber) =>
      getStringCellValue(personSheet, 1, columnNumber)
    );
    expect(profileHeaders).toEqual(["Фио", "Дата рождения", "Рост", "Вес", "Работа/учёба", "", ""]);
    expect(profileHeaders).not.toContain("Количество нагрузок в неделю");
    expect(profileHeaders).not.toContain("Разное");
    expect(getStringCellValue(personSheet, 2, 1)).toBe("Петров Иван Сергеевич");
    expect(personSheet.getCell("B2").value).toBeInstanceOf(Date);
    expect((personSheet.getCell("B2").value as Date).toISOString().slice(0, 10)).toBe("1990-02-03");
    expect(personSheet.getCell("C2").value).toBe(180);
    expect(personSheet.getCell("D2").value).toBe(70.5);
    expect(getStringCellValue(personSheet, 2, 5)).toBe("Работа");

    expect(getStringCellValue(personSheet, 4, 1)).toBe("Личный рекорд");
    expect(getStringCellValue(personSheet, 5, 2)).toBe("Марафон");
    expect(getStringCellValue(personSheet, 5, 1)).toBe("");
    expect(getStringCellValue(personSheet, 7, 1)).toBe("37:32");
    expect(getStringCellValue(personSheet, 7, 2)).toBe("10 км");
    expect(getStringCellValue(personSheet, 7, 3)).toBe("23.05.2026");

    expect(getStringCellValue(personSheet, 17, 1)).toBe("Дата");
    expect(personSheet.getColumn(2).width).toBe(110);
    expect(getStringCellValue(personSheet, 18, 1)).toBe("Подготовка");
    expect(personSheet.getCell("A18").isMerged).toBe(true);
    expect(getStringCellValue(personSheet, 19, 2)).toBe("Москва, 21.1 км");
    expect(getStringCellValue(personSheet, 19, 3)).toBe("1:21:16");
    expect(personSheet.getCell("A19").fill).toEqual(
      expect.objectContaining({
        fgColor: { argb: "FFFFFF00" },
      })
    );
    expect(getStringCellValue(personSheet, 20, 1)).toBe("Подготовка");
    expect(getStringCellValue(personSheet, 21, 2)).toBe("Московский марафон, 10 км");
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
    const sheet = getRequiredWorksheet(workbook, "Дневник");

    expect(getStringCellValue(sheet, 5, 13)).toBe("42.50 км");
    expect(getStringCellValue(sheet, 5, 13)).not.toBe("12.00 км");
  });

  it("должен оформлять шапку дневника как в исходном Excel", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-23", to: "2026-01-25" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);
    const sheet = getRequiredWorksheet(workbook, "Дневник");

    const headerRow = sheet.getRow(1);
    const headerCell = headerRow.getCell(1);

    expect(sheet.views).toEqual([expect.objectContaining({ state: "frozen", ySplit: 1 })]);
    expect(sheet.getColumn(2).width).toBe(101.125);
    expect(getStringCellValue(sheet, 1, 12)).toBe("Восстановление");
    expect(headerRow.height).toBe(105);
    expect(headerCell.font).toEqual(
      expect.objectContaining({
        bold: true,
        size: 20,
        name: "Ink Free",
        color: { argb: "FF000000" },
      })
    );
    expect(headerCell.fill).toEqual(
      expect.objectContaining({
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF92D050" },
        bgColor: { argb: "FFFFFF00" },
      })
    );
    expect(headerCell.alignment).toEqual(
      expect.objectContaining({
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      })
    );
    expect(headerCell.border).toEqual(
      expect.objectContaining({
        top: expect.objectContaining({ style: "medium" }),
        left: expect.objectContaining({ style: "medium" }),
        bottom: expect.objectContaining({ style: "medium" }),
        right: expect.objectContaining({ style: "medium" }),
      })
    );
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

    const sheet = getRequiredWorksheet(workbook, "Дневник");

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

    const sheet = getRequiredWorksheet(workbook, "Дневник");

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

    const sheet = getRequiredWorksheet(workbook, "Дневник");

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

    const sheet = getRequiredWorksheet(workbook, "Дневник");

    expect(sheet.rowCount).toBe(11);
    expect(getStringCellValue(sheet, 3, 13)).toBe("55.55 км");
    expect(getStringCellValue(sheet, 11, 13)).toBe("66.66 км");
  });

  it("должен сохранять html-разметку задачи и комментария как rich text", async () => {
    getDiaryExportRowsMock.mockResolvedValue([
      createExportRow({
        dateTime: "26.01.2026(Пн)",
        task: "Кросс &amp; ОФП",
        comment:
          '<b>Важно</b><br/><span style="color: #ff0000;">Красный</span><span style="font-weight: 600;">Без цвета</span>',
      }),
    ]);

    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-01-26", to: "2026-01-26" },
    });
    const response = await GET(request);
    const workbook = await loadWorkbookFromResponse(response);
    const sheet = getRequiredWorksheet(workbook, "Дневник");

    expect(getStringCellValue(sheet, 2, 2)).toBe("Кросс & ОФП");

    const commentValue = sheet.getRow(2).getCell(4).value;
    expect(commentValue).toEqual({
      richText: expect.arrayContaining([
        expect.objectContaining({
          text: "Важно",
          font: expect.objectContaining({ bold: true }),
        }),
        expect.objectContaining({ text: "\n" }),
        expect.objectContaining({
          text: "Красный",
          font: expect.objectContaining({ color: { argb: "FFFF0000" } }),
        }),
        expect.objectContaining({ text: "Без цвета" }),
      ]),
    });
  });
});
