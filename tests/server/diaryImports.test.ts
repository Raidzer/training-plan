import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbTransactionMock, parseDiaryWorkbookMock } = vi.hoisted(() => {
  return { dbSelectMock: vi.fn(), dbTransactionMock: vi.fn(), parseDiaryWorkbookMock: vi.fn() };
});

vi.mock("@/server/db/client", () => {
  return { db: { select: dbSelectMock, transaction: dbTransactionMock } };
});

vi.mock("@/server/diaryImportParser", () => {
  return { parseDiaryWorkbook: parseDiaryWorkbookMock };
});

import { planEntries, recoveryEntries, weightEntries, workoutReports } from "@/server/db/schema";
import { type ParsedDiaryImportRow } from "@/server/diaryImportParser";
import { importDiaryFromWorkbook } from "@/server/diaryImports";

function createParsedRow(overrides: Partial<ParsedDiaryImportRow> = {}): ParsedDiaryImportRow {
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

function mockParsedRows(rows: ParsedDiaryImportRow[]) {
  parseDiaryWorkbookMock.mockResolvedValue({
    sheetName: "Дневник(2026)",
    rows,
    errors: [],
    warnings: [],
  });
}

function createTx(
  params: {
    rows?: ParsedDiaryImportRow[];
    existingTable?: unknown;
    noPlan?: boolean;
  } = {}
) {
  const rows = params.rows ?? [createParsedRow()];
  const batches: Array<{ table: unknown; rows: Record<string, unknown>[] }> = [];
  const insertedReports = new Set<number>();
  const returningMock = vi.fn(async (values: Record<string, unknown>[]) => {
    return values
      .filter((value) => {
        const planEntryId = value.planEntryId as number;
        if (insertedReports.has(planEntryId)) {
          return false;
        }
        insertedReports.add(planEntryId);
        return true;
      })
      .map((value) => ({ id: value.planEntryId }));
  });
  const insertFailureMock = vi.fn().mockResolvedValue(undefined);
  const tx = {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    select: vi.fn(() => {
      return {
        from: vi.fn((table: unknown) => {
          const selected =
            table === planEntries
              ? params.noPlan
                ? []
                : rows.map((row, index) => ({
                    id: index + 11,
                    date: row.date,
                    sessionOrder: row.sessionOrder,
                    taskText: row.taskText,
                  }))
              : table === params.existingTable
                ? [{ date: "2026-02-01" }]
                : [];
          return {
            where: vi.fn(() => {
              return Object.assign(Promise.resolve(selected), {
                orderBy: vi.fn().mockResolvedValue(selected),
              });
            }),
          };
        }),
      };
    }),
    insert: vi.fn((table: unknown) => {
      return {
        values: vi.fn((values: Record<string, unknown> | Record<string, unknown>[]) => {
          const valuesArray = Array.isArray(values) ? values : [values];
          batches.push({ table, rows: valuesArray });
          const query = {
            returning: vi.fn(async () => {
              await insertFailureMock(table);
              return await returningMock(valuesArray);
            }),
            then: (
              resolve: (value: undefined) => unknown,
              reject: (reason: unknown) => unknown
            ) => {
              return insertFailureMock(table).then(resolve, reject);
            },
          };
          return {
            onConflictDoNothing: vi.fn(() => query),
            onConflictDoUpdate: vi.fn(() => query),
          };
        }),
      };
    }),
  };
  dbSelectMock.mockImplementation(tx.select);
  dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
    return await callback(tx);
  });
  return { tx, batches, returningMock, insertFailureMock };
}

function runImport() {
  return importDiaryFromWorkbook({ userId: 7, buffer: new ArrayBuffer(8) });
}

describe("server/diaryImports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockParsedRows([createParsedRow()]);
  });

  it("сохраняет отчёт, вес и восстановление пакетами после транзакционной проверки", async () => {
    const { tx, batches } = createTx();
    expect(await runImport()).toMatchObject({
      parsedRows: 1,
      matchedRows: 1,
      reportsUpserted: 1,
      reportsSkipped: 0,
      weightEntriesUpserted: 2,
      recoveryEntriesUpserted: 1,
      skippedRows: 0,
    });
    expect(batches).toEqual([
      {
        table: workoutReports,
        rows: [
          expect.objectContaining({
            userId: 7,
            planEntryId: 11,
            date: "2026-02-01",
            startTime: "07:30",
            resultText: "10 км: 50:00",
            distanceKm: "10.00",
            overallScore: 8,
          }),
        ],
      },
      {
        table: weightEntries,
        rows: [
          expect.objectContaining({ period: "morning", weightKg: "70.1" }),
          expect.objectContaining({ period: "evening", weightKg: "69.8" }),
        ],
      },
      {
        table: recoveryEntries,
        rows: [expect.objectContaining({ hasBath: true, sleepHours: "8.5" })],
      },
    ]);
    expect(dbSelectMock).not.toHaveBeenCalled();
    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      tx.select.mock.invocationCallOrder[0]
    );
  });

  it("ожидает блокировку до проверки плана и заполненных дней", async () => {
    const { tx } = createTx();
    let releaseLock!: () => void;
    const waitingLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    tx.execute.mockImplementation(async () => {
      await waitingLock;
      return { rows: [] };
    });
    const pending = runImport();
    await Promise.resolve();
    await Promise.resolve();
    expect(dbSelectMock).not.toHaveBeenCalled();
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    releaseLock();
    await pending;
    expect(tx.select).toHaveBeenCalledTimes(4);
  });

  it("пропускает строку без плановой тренировки", async () => {
    const { tx } = createTx({ noPlan: true });
    expect(await runImport()).toMatchObject({
      matchedRows: 0,
      reportsUpserted: 0,
      skippedRows: 1,
      warnings: [
        { row: 2, message: "Не найдена тренировка плана для даты 2026-02-01 и порядка 1." },
      ],
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it.each([
    ["отчётом", workoutReports],
    ["весом", weightEntries],
    ["восстановлением", recoveryEntries],
  ])("пропускает заполненный день с существующим %s", async (_, table) => {
    const { tx } = createTx({ existingTable: table });
    expect(await runImport()).toMatchObject({
      matchedRows: 0,
      reportsUpserted: 0,
      reportsSkipped: 1,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
      skippedRows: 1,
      warnings: [{ row: 2, message: "День 2026-02-01 уже заполнен, импорт строки пропущен." }],
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("сохраняет null времени и оценку в отчёте без другого содержимого", async () => {
    const row = createParsedRow({
      startTime: null,
      resultText: "",
      commentText: null,
      distanceKm: null,
      sleepHours: null,
      morningWeightKg: null,
      eveningWeightKg: null,
      hasBath: false,
      hasMfr: false,
      hasMassage: false,
    });
    mockParsedRows([row]);
    const { batches } = createTx({ rows: [row] });
    expect(await runImport()).toMatchObject({ reportsUpserted: 1 });
    expect(batches).toEqual([
      {
        table: workoutReports,
        rows: [
          expect.objectContaining({
            planEntryId: 11,
            startTime: null,
            resultText: "-",
            overallScore: 8,
            functionalScore: 9,
            muscleScore: 7,
          }),
        ],
      },
    ]);
  });

  it("сохраняет обе тренировки дня и последние значения веса, флагов и непустого сна", async () => {
    const rows = [
      createParsedRow(),
      createParsedRow({
        rowNumber: 3,
        sessionOrder: 2,
        resultText: "Вторая тренировка",
        morningWeightKg: 70.4,
        eveningWeightKg: null,
        sleepHours: null,
        hasBath: false,
        hasMassage: true,
      }),
    ];
    mockParsedRows(rows);
    const { batches } = createTx({ rows });
    expect(await runImport()).toMatchObject({
      matchedRows: 2,
      reportsUpserted: 2,
      reportsSkipped: 0,
      weightEntriesUpserted: 3,
      recoveryEntriesUpserted: 2,
    });
    expect(batches.find((batch) => batch.table === workoutReports)?.rows).toEqual([
      expect.objectContaining({ planEntryId: 11, resultText: "10 км: 50:00" }),
      expect.objectContaining({ planEntryId: 12, resultText: "Вторая тренировка" }),
    ]);
    expect(batches.find((batch) => batch.table === weightEntries)?.rows).toEqual([
      expect.objectContaining({ period: "morning", weightKg: "70.4" }),
      expect.objectContaining({ period: "evening", weightKg: "69.8" }),
    ]);
    expect(batches.find((batch) => batch.table === recoveryEntries)?.rows).toEqual([
      expect.objectContaining({
        sleepHours: "8.5",
        hasBath: false,
        hasMfr: false,
        hasMassage: true,
      }),
    ]);
  });

  it("не стирает восстановление строкой без recovery payload", async () => {
    const rows = [
      createParsedRow(),
      createParsedRow({
        rowNumber: 3,
        sessionOrder: 2,
        sleepHours: null,
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
      }),
    ];
    mockParsedRows(rows);
    const { batches } = createTx({ rows });
    expect(await runImport()).toMatchObject({ recoveryEntriesUpserted: 1 });
    expect(batches.filter((batch) => batch.table === recoveryEntries)).toEqual([
      {
        table: recoveryEntries,
        rows: [expect.objectContaining({ sleepHours: "8.5", hasBath: true })],
      },
    ]);
  });

  it("считает отчёты по реальным вставкам при конфликте внутри файла", async () => {
    const rows = [createParsedRow(), createParsedRow({ rowNumber: 3 })];
    mockParsedRows(rows);
    createTx({ rows });
    expect(await runImport()).toMatchObject({ matchedRows: 2, reportsUpserted: 1 });
  });

  it("ограничивает каждый пакет отчётов, веса и восстановления 500 записями", async () => {
    const rows = Array.from({ length: 501 }, (_, index) => {
      return createParsedRow({
        date: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
      });
    });
    mockParsedRows(rows);
    const { batches } = createTx({ rows });
    expect(await runImport()).toMatchObject({
      reportsUpserted: 501,
      weightEntriesUpserted: 1002,
      recoveryEntriesUpserted: 501,
    });
    expect(
      batches.filter((batch) => batch.table === workoutReports).map((batch) => batch.rows.length)
    ).toEqual([500, 1]);
    expect(
      batches.filter((batch) => batch.table === weightEntries).map((batch) => batch.rows.length)
    ).toEqual([500, 500, 2]);
    expect(
      batches.filter((batch) => batch.table === recoveryEntries).map((batch) => batch.rows.length)
    ).toEqual([500, 1]);
  });

  it("пробрасывает ошибку записи из транзакции", async () => {
    const { insertFailureMock } = createTx();
    insertFailureMock.mockRejectedValueOnce(new Error("insert failed"));
    await expect(runImport()).rejects.toThrow("insert failed");
  });

  it("возвращает ошибки разбора без транзакции для книги без допустимых строк", async () => {
    parseDiaryWorkbookMock.mockResolvedValue({
      sheetName: "Дневник(2026)",
      rows: [],
      errors: [{ row: 2, message: "Дата не распознана" }],
      warnings: [],
    });
    expect(await runImport()).toMatchObject({ parsedRows: 0, skippedRows: 1, reportsUpserted: 0 });
    expect(dbTransactionMock).not.toHaveBeenCalled();
  });
});
