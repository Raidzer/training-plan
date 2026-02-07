import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbInsertMock, dbUpdateMock, dbDeleteMock, dbTransactionMock } = vi.hoisted(
  () => {
    return {
      dbSelectMock: vi.fn(),
      dbInsertMock: vi.fn(),
      dbUpdateMock: vi.fn(),
      dbDeleteMock: vi.fn(),
      dbTransactionMock: vi.fn(),
    };
  }
);

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      insert: dbInsertMock,
      update: dbUpdateMock,
      delete: dbDeleteMock,
      transaction: dbTransactionMock,
    },
  };
});

import {
  deletePlanEntriesForDate,
  getPlanEntriesWithReportFlags,
  upsertPlanEntriesForDate,
} from "@/server/plans";

function createSelectFactory(selectQueue: unknown[]) {
  return vi.fn(() => {
    let orderedQuery = false;
    const builder: any = {};

    builder.from = vi.fn(() => {
      return builder;
    });
    builder.leftJoin = vi.fn(() => {
      orderedQuery = true;
      return builder;
    });
    builder.where = vi.fn(() => {
      if (orderedQuery) {
        return builder;
      }
      const next = selectQueue.shift();
      return Promise.resolve(next);
    });
    builder.orderBy = vi.fn(() => {
      let consumed = false;
      let value: unknown;
      const consume = () => {
        if (!consumed) {
          value = selectQueue.shift();
          consumed = true;
        }
        return value;
      };

      const orderResult: any = {
        limit: vi.fn(() => {
          const next = consume();
          return Promise.resolve(next);
        }),
        then: (resolve: (value: unknown) => unknown) => {
          const next = consume();
          return Promise.resolve(resolve(next));
        },
      };

      return orderResult;
    });
    builder.limit = vi.fn(() => {
      const next = selectQueue.shift();
      return Promise.resolve(next);
    });

    return builder;
  });
}

function createTx(selectQueue: unknown[]) {
  const select = createSelectFactory(selectQueue);
  const insertValuesMock = vi.fn().mockResolvedValue(undefined);
  const updateWhereMock = vi.fn().mockResolvedValue(undefined);
  const deleteWhereMock = vi.fn().mockResolvedValue(undefined);

  const tx = {
    select,
    insert: vi.fn(() => {
      return {
        values: insertValuesMock,
      };
    }),
    update: vi.fn(() => {
      return {
        set: vi.fn(() => {
          return {
            where: updateWhereMock,
          };
        }),
      };
    }),
    delete: vi.fn(() => {
      return {
        where: deleteWhereMock,
      };
    }),
  };

  return {
    tx,
    insertValuesMock,
    updateWhereMock,
    deleteWhereMock,
  };
}

describe("server/plans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPlanEntriesWithReportFlags должен возвращать данные из db", async () => {
    const rows = [
      {
        id: 1,
        date: "2026-01-01",
        sessionOrder: 1,
        taskText: "Run",
        commentText: null,
        importId: null,
        isWorkload: true,
        hasReport: false,
      },
    ];
    const selectFactory = createSelectFactory([rows]);
    dbSelectMock.mockImplementation(selectFactory);

    const result = await getPlanEntriesWithReportFlags(7, 200);

    expect(result).toEqual(rows);
  });

  it("upsertPlanEntriesForDate должен возвращать date_exists при создании существующей даты", async () => {
    const { tx } = createTx([[{ id: 1, date: "2026-01-01" }]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await upsertPlanEntriesForDate({
      userId: 5,
      date: "2026-01-01",
      originalDate: "2026-01-01",
      isWorkload: false,
      entries: [{ id: null, taskText: "Run", commentText: null }],
      isEdit: false,
    });

    expect(result).toEqual({ error: "date_exists" });
  });

  it("upsertPlanEntriesForDate должен возвращать not_found при редактировании отсутствующей даты", async () => {
    const { tx } = createTx([[]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await upsertPlanEntriesForDate({
      userId: 5,
      date: "2026-01-05",
      originalDate: "2026-01-01",
      isWorkload: false,
      entries: [{ id: 1, taskText: "Run", commentText: null }],
      isEdit: true,
    });

    expect(result).toEqual({ error: "not_found" });
  });

  it("upsertPlanEntriesForDate должен возвращать invalid_entry_id при id в create режиме", async () => {
    const { tx } = createTx([[]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await upsertPlanEntriesForDate({
      userId: 5,
      date: "2026-01-02",
      originalDate: "2026-01-02",
      isWorkload: false,
      entries: [{ id: 10, taskText: "Run", commentText: null }],
      isEdit: false,
    });

    expect(result).toEqual({ error: "invalid_entry_id" });
  });

  it("upsertPlanEntriesForDate должен возвращать invalid_entry_id, если id не принадлежит дате", async () => {
    const { tx } = createTx([[{ id: 1, date: "2026-01-01" }], [{ id: 2 }]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await upsertPlanEntriesForDate({
      userId: 5,
      date: "2026-01-01",
      originalDate: "2026-01-01",
      isWorkload: false,
      entries: [{ id: 99, taskText: "Run", commentText: null }],
      isEdit: true,
    });

    expect(result).toEqual({ error: "invalid_entry_id" });
  });

  it("upsertPlanEntriesForDate должен возвращать entries при успешном создании", async () => {
    const updatedEntries = [
      {
        id: 10,
        date: "2026-02-01",
        sessionOrder: 1,
        taskText: "Run",
        commentText: null,
        importId: null,
        isWorkload: true,
        hasReport: false,
      },
    ];
    const { tx, insertValuesMock } = createTx([[], updatedEntries]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await upsertPlanEntriesForDate({
      userId: 5,
      date: "2026-02-01",
      originalDate: "2026-02-01",
      isWorkload: true,
      entries: [{ id: null, taskText: "Run", commentText: null }],
      isEdit: false,
    });

    expect(insertValuesMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ entries: updatedEntries });
  });

  it("deletePlanEntriesForDate должен возвращать not_found, если день отсутствует", async () => {
    const { tx } = createTx([[]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await deletePlanEntriesForDate({
      userId: 8,
      date: "2026-03-01",
    });

    expect(result).toEqual({ error: "not_found" });
  });

  it("deletePlanEntriesForDate должен удалять день и возвращать deleted", async () => {
    const { tx, deleteWhereMock } = createTx([[{ id: 1 }, { id: 2 }], [{ id: 20 }]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await deletePlanEntriesForDate({
      userId: 8,
      date: "2026-03-02",
    });

    expect(deleteWhereMock).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});
