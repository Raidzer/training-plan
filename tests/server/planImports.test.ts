import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbTransactionMock } = vi.hoisted(() => {
  return { dbSelectMock: vi.fn(), dbTransactionMock: vi.fn() };
});

vi.mock("@/server/db/client", () => {
  return { db: { select: dbSelectMock, transaction: dbTransactionMock } };
});

import { planEntries, planImports } from "@/server/db/schema";
import {
  createPlanImport,
  getExistingPlanEntryDates,
  getLatestPlanEntryDate,
  type PlanImportEntry,
} from "@/server/planImports";

function createSelect(rows: unknown[]) {
  return {
    from: vi.fn(() => {
      return {
        where: vi.fn(() => {
          return Object.assign(Promise.resolve(rows), {
            orderBy: vi.fn(() => {
              return { limit: vi.fn().mockResolvedValue(rows) };
            }),
          });
        }),
      };
    }),
  };
}

function createEntry(overrides: Partial<PlanImportEntry> = {}): PlanImportEntry {
  return {
    userId: 5,
    date: "2026-02-01",
    sessionOrder: 1,
    taskText: "Run",
    commentText: null,
    isWorkload: false,
    rawRow: { date: "2026-02-01", task: "Run", isWorkload: false },
    ...overrides,
  };
}

function createTx(existingDates: string[] = []) {
  const batches: Array<{ table: unknown; rows: Record<string, unknown>[] }> = [];
  const returningMock = vi.fn(async (rows: Record<string, unknown>[]) => {
    return rows.map((_, index) => ({ id: index + 1 }));
  });
  const updateWhereMock = vi.fn().mockResolvedValue(undefined);
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
  const tx = {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    select: vi.fn(() => createSelect(existingDates.map((date) => ({ date })))),
    insert: vi.fn((table: unknown) => {
      return {
        values: vi.fn((values: Record<string, unknown> | Record<string, unknown>[]) => {
          const rows = Array.isArray(values) ? values : [values];
          batches.push({ table, rows });
          return Object.assign(Promise.resolve(undefined), {
            returning: vi.fn(async () => {
              if (table === planImports) {
                return [{ id: 10 }];
              }
              return await returningMock(rows);
            }),
          });
        }),
      };
    }),
    update: vi.fn(() => ({ set: updateSetMock })),
  };
  dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
    return await callback(tx);
  });
  return { tx, batches, returningMock, updateSetMock };
}

describe("server/planImports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("возвращает пустой set без запроса при пустом списке дат", async () => {
    expect(await getExistingPlanEntryDates(5, [])).toEqual(new Set());
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("возвращает существующие даты через обычное соединение", async () => {
    dbSelectMock.mockReturnValue(createSelect([{ date: "2026-02-01" }]));
    expect(await getExistingPlanEntryDates(5, ["2026-02-01", "2026-02-03"])).toEqual(
      new Set(["2026-02-01"])
    );
  });

  it("возвращает последнюю дату или null", async () => {
    dbSelectMock.mockReturnValue(createSelect([{ date: "2026-02-09" }]));
    expect(await getLatestPlanEntryDate(5)).toBe("2026-02-09");
    dbSelectMock.mockReturnValue(createSelect([]));
    expect(await getLatestPlanEntryDate(5)).toBeNull();
  });

  it("проверяет даты внутри транзакции и пропускает существующий день целиком", async () => {
    const { tx, batches, updateSetMock } = createTx(["2026-02-01"]);
    const entries = [
      createEntry(),
      createEntry({ sessionOrder: 2 }),
      createEntry({ date: "2026-02-02" }),
    ];
    const params = { userId: 5, filename: "import.xlsx", rowCount: 3, entries, errorsCount: 1 };

    expect(await createPlanImport(params)).toEqual({ id: 10, insertedCount: 1 });
    expect(batches.filter((batch) => batch.table === planEntries)).toEqual([
      { table: planEntries, rows: [expect.objectContaining({ date: "2026-02-02", importId: 10 })] },
    ]);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ insertedCount: 1, skippedCount: 3 })
    );
    expect(dbSelectMock).not.toHaveBeenCalled();
    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      tx.select.mock.invocationCallOrder[0]
    );
  });

  it("ожидает блокировку до чтения и записи", async () => {
    const { tx } = createTx();
    let releaseLock!: () => void;
    const waitingLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    tx.execute.mockImplementation(async () => {
      await waitingLock;
      return { rows: [] };
    });
    const entries = [createEntry()];
    const params = { userId: 5, filename: "import.xlsx", rowCount: 1, entries, errorsCount: 0 };
    const pending = createPlanImport(params);
    await Promise.resolve();
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    releaseLock();
    await pending;
    expect(tx.select).toHaveBeenCalledOnce();
  });

  it("сохраняет несколько тренировок нового дня пакетами не более 500 записей", async () => {
    const { batches } = createTx();
    const entries = Array.from({ length: 501 }, (_, index) =>
      createEntry({ sessionOrder: index + 1 })
    );
    const params = { userId: 5, filename: "import.xlsx", rowCount: 501, entries, errorsCount: 0 };
    expect(await createPlanImport(params)).toEqual({ id: 10, insertedCount: 501 });
    const entryBatches = batches.filter((batch) => batch.table === planEntries);
    expect(entryBatches.map((batch) => batch.rows.length)).toEqual([500, 1]);
    expect(entryBatches.flatMap((batch) => batch.rows).map((row) => row.sessionOrder)).toEqual(
      Array.from({ length: 501 }, (_, index) => index + 1)
    );
  });

  it("считает только возвращённые БД вставки", async () => {
    const { returningMock, updateSetMock } = createTx();
    returningMock.mockResolvedValueOnce([{ id: 15 }]);
    const entries = [createEntry(), createEntry({ sessionOrder: 2 })];
    const params = { userId: 5, filename: "import.xlsx", rowCount: 2, entries, errorsCount: 1 };
    expect(await createPlanImport(params)).toEqual({ id: 10, insertedCount: 1 });
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ insertedCount: 1, skippedCount: 2 })
    );
  });

  it("не вставляет planEntries, если все даты уже существуют", async () => {
    const { batches, updateSetMock } = createTx(["2026-02-01"]);
    const entries = [createEntry()];
    const params = { userId: 5, filename: "import.xlsx", rowCount: 1, entries, errorsCount: 0 };
    expect(await createPlanImport(params)).toEqual({ id: 10, insertedCount: 0 });
    expect(batches.map((batch) => batch.table)).toEqual([planImports]);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ insertedCount: 0, skippedCount: 1 })
    );
  });

  it("пробрасывает ошибку SQL из транзакции без отметки завершения импорта", async () => {
    const { returningMock, updateSetMock } = createTx();
    returningMock.mockRejectedValueOnce(new Error("insert failed"));
    const entries = [createEntry()];
    const params = { userId: 5, filename: "import.xlsx", rowCount: 1, entries, errorsCount: 0 };
    await expect(createPlanImport(params)).rejects.toThrow("insert failed");
    expect(updateSetMock).not.toHaveBeenCalled();
  });
});
