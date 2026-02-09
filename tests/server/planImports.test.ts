import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbTransactionMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbTransactionMock: vi.fn(),
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

import {
  createPlanImport,
  getExistingPlanEntryDates,
  getLatestPlanEntryDate,
} from "@/server/planImports";

function mockSelectWhereResult(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });
  dbSelectMock.mockReturnValue({
    from: fromMock,
  });
}

function mockSelectOrderByLimitResult(rows: unknown[]) {
  const limitMock = vi.fn().mockResolvedValue(rows);
  const orderByMock = vi.fn(() => {
    return {
      limit: limitMock,
    };
  });
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
  dbSelectMock.mockReturnValue({
    from: fromMock,
  });
}

describe("server/planImports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getExistingPlanEntryDates должен возвращать пустой set при пустом списке дат", async () => {
    const result = await getExistingPlanEntryDates(5, []);

    expect(Array.from(result)).toEqual([]);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("getExistingPlanEntryDates должен возвращать set существующих дат", async () => {
    mockSelectWhereResult([{ date: "2026-02-01" }, { date: "2026-02-02" }]);

    const result = await getExistingPlanEntryDates(5, ["2026-02-01", "2026-02-03"]);

    expect(Array.from(result)).toEqual(["2026-02-01", "2026-02-02"]);
  });

  it("getLatestPlanEntryDate должен возвращать последнюю дату или null", async () => {
    mockSelectOrderByLimitResult([{ date: "2026-02-09" }]);

    const latest = await getLatestPlanEntryDate(5);
    expect(latest).toBe("2026-02-09");

    mockSelectOrderByLimitResult([]);
    const empty = await getLatestPlanEntryDate(5);
    expect(empty).toBeNull();
  });

  it("createPlanImport должен создавать импорт и сохранять новые элементы", async () => {
    const importReturningMock = vi.fn().mockResolvedValue([{ id: 10 }]);
    const importValuesMock = vi.fn(() => {
      return {
        returning: importReturningMock,
      };
    });
    const insertEntriesValuesMock = vi.fn().mockResolvedValue(undefined);
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => {
      return {
        where: updateWhereMock,
      };
    });

    const tx = {
      insert: vi
        .fn()
        .mockImplementationOnce(() => {
          return {
            values: importValuesMock,
          };
        })
        .mockImplementationOnce(() => {
          return {
            values: insertEntriesValuesMock,
          };
        }),
      update: vi.fn(() => {
        return {
          set: updateSetMock,
        };
      }),
    };

    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx as any);
    });

    const result = await createPlanImport({
      userId: 5,
      filename: "import.xlsx",
      rowCount: 3,
      entries: [
        {
          userId: 5,
          date: "2026-02-01",
          sessionOrder: 1,
          taskText: "Run",
          commentText: null,
          isWorkload: false,
          rawRow: { date: "2026-02-01", task: "Run", isWorkload: false },
        },
      ],
      newEntries: [
        {
          userId: 5,
          date: "2026-02-01",
          sessionOrder: 1,
          taskText: "Run",
          commentText: null,
          isWorkload: false,
          rawRow: { date: "2026-02-01", task: "Run", isWorkload: false },
        },
      ],
      errorsCount: 1,
    });

    expect(result).toEqual({ id: 10, insertedCount: 1 });
    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(insertEntriesValuesMock).toHaveBeenCalledWith([
      expect.objectContaining({
        importId: 10,
        userId: 5,
        date: "2026-02-01",
      }),
    ]);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insertedCount: 1,
        skippedCount: 1,
      })
    );
  });

  it("createPlanImport должен пропускать вставку в planEntries, когда newEntries отсутствуют", async () => {
    const importReturningMock = vi.fn().mockResolvedValue([{ id: 10 }]);
    const importValuesMock = vi.fn(() => {
      return {
        returning: importReturningMock,
      };
    });
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => {
      return {
        where: updateWhereMock,
      };
    });

    const tx = {
      insert: vi.fn(() => {
        return {
          values: importValuesMock,
        };
      }),
      update: vi.fn(() => {
        return {
          set: updateSetMock,
        };
      }),
    };

    dbTransactionMock.mockImplementation(async (callback: (innerTx: typeof tx) => unknown) => {
      return await callback(tx as any);
    });

    const result = await createPlanImport({
      userId: 5,
      filename: "import.xlsx",
      rowCount: 1,
      entries: [],
      newEntries: [],
      errorsCount: 0,
    });

    expect(result).toEqual({ id: 10, insertedCount: 0 });
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insertedCount: 0,
        skippedCount: 0,
      })
    );
  });
});
