import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbTransactionMock, parseDiaryWorkbookMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbTransactionMock: vi.fn(),
    parseDiaryWorkbookMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      transaction: dbTransactionMock,
    },
  };
});

vi.mock("@/server/diaryImportParser", () => {
  return {
    parseDiaryWorkbook: parseDiaryWorkbookMock,
  };
});

import { importDiaryFromWorkbook } from "@/server/diaryImports";

function createPlanRowsSelect(rows: unknown[]) {
  const orderByMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn(() => {
    return {
      orderBy: orderByMock,
    };
  });
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });
  return {
    from: fromMock,
  };
}

function createExistingDateRowsSelect(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });
  return {
    from: fromMock,
  };
}

function mockImportSelects(params: {
  planRows: unknown[];
  existingReportRows?: unknown[];
  existingWeightRows?: unknown[];
  existingRecoveryRows?: unknown[];
}) {
  dbSelectMock.mockReturnValueOnce(createPlanRowsSelect(params.planRows));
  dbSelectMock.mockReturnValueOnce(createExistingDateRowsSelect(params.existingReportRows ?? []));
  dbSelectMock.mockReturnValueOnce(createExistingDateRowsSelect(params.existingWeightRows ?? []));
  dbSelectMock.mockReturnValueOnce(createExistingDateRowsSelect(params.existingRecoveryRows ?? []));
}

function createTx() {
  const onConflictDoUpdateMock = vi.fn().mockResolvedValue(undefined);
  const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
  const valuesMock = vi.fn(() => {
    return {
      onConflictDoUpdate: onConflictDoUpdateMock,
      onConflictDoNothing: onConflictDoNothingMock,
    };
  });
  const tx = {
    insert: vi.fn(() => {
      return {
        values: valuesMock,
      };
    }),
  };

  return {
    tx,
    valuesMock,
    onConflictDoUpdateMock,
    onConflictDoNothingMock,
  };
}

function createParsedRow(overrides: Record<string, unknown> = {}) {
  return {
    rowNumber: 2,
    sessionOrder: 1,
    date: "2026-02-01",
    rawDate: "01.02.2026(Вс)\n\n07:30",
    startTime: "07:30",
    taskText: "10 км",
    resultText: "10 км: 50:00",
    commentText: "Хорошо",
    distanceKm: 10,
    overallScore: 8,
    functionalScore: 9,
    muscleScore: 7,
    sleepHours: 8.5,
    morningWeightKg: 70.1,
    eveningWeightKg: 69.8,
    hasBath: true,
    hasMfr: false,
    hasMassage: false,
    ...overrides,
  };
}

describe("server/diaryImports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseDiaryWorkbookMock.mockResolvedValue({
      sheetName: "Дневник(2026)",
      rows: [createParsedRow()],
      errors: [],
      warnings: [],
    });
  });

  it("должен привязывать строку дневника к plan_entries и сохранять отчет, вес и восстановление", async () => {
    mockImportSelects({
      planRows: [{ id: 11, date: "2026-02-01", sessionOrder: 1, taskText: "10 км" }],
    });
    const { tx, valuesMock, onConflictDoNothingMock } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx);
    });

    const result = await importDiaryFromWorkbook({
      userId: 7,
      buffer: new ArrayBuffer(8),
    });

    expect(result).toMatchObject({
      parsedRows: 1,
      matchedRows: 1,
      reportsUpserted: 1,
      reportsSkipped: 0,
      weightEntriesUpserted: 2,
      recoveryEntriesUpserted: 1,
      skippedRows: 0,
    });
    expect(tx.insert).toHaveBeenCalledTimes(4);
    expect(onConflictDoNothingMock).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 7,
        planEntryId: 11,
        date: "2026-02-01",
        startTime: "07:30",
        resultText: "10 км: 50:00",
        distanceKm: "10.00",
        overallScore: 8,
        functionalScore: 9,
        muscleScore: 7,
      })
    );
    expect(valuesMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        period: "morning",
        weightKg: "70.1",
      })
    );
    expect(valuesMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        period: "evening",
        weightKg: "69.8",
      })
    );
    expect(valuesMock).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        hasBath: true,
        sleepHours: "8.5",
      })
    );
  });

  it("должен пропускать строку, если плановая тренировка не найдена", async () => {
    mockImportSelects({ planRows: [] });

    const tx = {
      insert: vi.fn(),
    };
    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx);
    });

    const result = await importDiaryFromWorkbook({
      userId: 7,
      buffer: new ArrayBuffer(8),
    });

    expect(result).toMatchObject({
      parsedRows: 1,
      matchedRows: 0,
      reportsUpserted: 0,
      reportsSkipped: 0,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
      skippedRows: 1,
    });
    expect(tx.insert).not.toHaveBeenCalled();
    expect(result.warnings).toEqual([
      {
        row: 2,
        message: "Не найдена тренировка плана для даты 2026-02-01 и порядка 1.",
      },
    ]);
  });

  it("должен сохранять null, если в импорте нет времени старта", async () => {
    parseDiaryWorkbookMock.mockResolvedValue({
      sheetName: "Дневник(2026)",
      rows: [
        createParsedRow({
          rawDate: "01.02.2026(Вс)",
          startTime: null,
          resultText: "10 км: 50:00",
          commentText: null,
          distanceKm: null,
          sleepHours: null,
          morningWeightKg: null,
          eveningWeightKg: null,
          hasBath: false,
          hasMfr: false,
          hasMassage: false,
        }),
      ],
      errors: [],
      warnings: [],
    });
    mockImportSelects({
      planRows: [{ id: 11, date: "2026-02-01", sessionOrder: 1, taskText: "10 км" }],
    });
    const { tx, valuesMock } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx);
    });

    const result = await importDiaryFromWorkbook({
      userId: 7,
      buffer: new ArrayBuffer(8),
    });

    expect(result).toMatchObject({
      matchedRows: 1,
      reportsUpserted: 1,
      warnings: [],
    });
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: null,
        resultText: "10 км: 50:00",
      })
    );
  });

  it("должен пропускать заполненный день с существующим отчетом", async () => {
    mockImportSelects({
      planRows: [{ id: 11, date: "2026-02-01", sessionOrder: 1, taskText: "10 км" }],
      existingReportRows: [{ date: "2026-02-01" }],
    });
    const { tx } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx);
    });

    const result = await importDiaryFromWorkbook({
      userId: 7,
      buffer: new ArrayBuffer(8),
    });

    expect(result).toMatchObject({
      parsedRows: 1,
      matchedRows: 0,
      reportsUpserted: 0,
      reportsSkipped: 1,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
      skippedRows: 1,
    });
    expect(tx.insert).not.toHaveBeenCalled();
    expect(result.warnings).toEqual([
      {
        row: 2,
        message: "День 2026-02-01 уже заполнен, импорт строки пропущен.",
      },
    ]);
  });

  it("должен пропускать заполненный день с существующим весом", async () => {
    mockImportSelects({
      planRows: [{ id: 11, date: "2026-02-01", sessionOrder: 1, taskText: "10 км" }],
      existingWeightRows: [{ date: "2026-02-01" }],
    });
    const { tx } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx);
    });

    const result = await importDiaryFromWorkbook({
      userId: 7,
      buffer: new ArrayBuffer(8),
    });

    expect(result).toMatchObject({
      parsedRows: 1,
      matchedRows: 0,
      reportsUpserted: 0,
      reportsSkipped: 1,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
      skippedRows: 1,
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("должен импортировать оценку как часть отчета тренировки", async () => {
    parseDiaryWorkbookMock.mockResolvedValue({
      sheetName: "Дневник(2026)",
      rows: [
        createParsedRow({
          resultText: "",
          commentText: null,
          distanceKm: null,
          sleepHours: null,
          morningWeightKg: null,
          eveningWeightKg: null,
          hasBath: false,
          hasMfr: false,
          hasMassage: false,
          overallScore: 9,
          functionalScore: 8,
          muscleScore: 7,
        }),
      ],
      errors: [],
      warnings: [],
    });
    mockImportSelects({
      planRows: [{ id: 11, date: "2026-02-01", sessionOrder: 1, taskText: "10 км" }],
    });
    const { tx, valuesMock } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx);
    });

    const result = await importDiaryFromWorkbook({
      userId: 7,
      buffer: new ArrayBuffer(8),
    });

    expect(result).toMatchObject({
      parsedRows: 1,
      matchedRows: 1,
      reportsUpserted: 1,
      reportsSkipped: 0,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
      skippedRows: 0,
    });
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        planEntryId: 11,
        resultText: "-",
        overallScore: 9,
        functionalScore: 8,
        muscleScore: 7,
      })
    );
  });
});
