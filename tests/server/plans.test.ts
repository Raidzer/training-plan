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
  shiftPlanEntriesFromDate,
  updatePlanEntryText,
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
  const updateSetMock = vi.fn(() => {
    return {
      where: updateWhereMock,
    };
  });
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
        set: updateSetMock,
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
    updateSetMock,
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

  it("upsertPlanEntriesForDate должен возвращать invalid_entry_id при id в создавать режиме", async () => {
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

  it("upsertPlanEntriesForDate должен запрещать смену даты дня с отчетом", async () => {
    const { tx, updateWhereMock } = createTx([
      [{ id: 1, date: "2026-01-01" }],
      [{ id: 1 }],
      [{ id: 20 }],
    ]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await upsertPlanEntriesForDate({
      userId: 5,
      date: "2026-01-02",
      originalDate: "2026-01-01",
      isWorkload: false,
      entries: [{ id: 1, taskText: "Run", commentText: null }],
      isEdit: true,
    });

    expect(updateWhereMock).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "date_locked_by_report" });
  });

  it("upsertPlanEntriesForDate должен возвращать элементы при успешном создании", async () => {
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

  it("updatePlanEntryText должен обновлять текст существующей тренировки", async () => {
    const selectFactory = createSelectFactory([[{ id: 10 }]]);
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => {
      return {
        where: updateWhereMock,
      };
    });
    dbSelectMock.mockImplementation(selectFactory);
    dbUpdateMock.mockReturnValue({
      set: updateSetMock,
    });

    const result = await updatePlanEntryText({
      userId: 5,
      entryId: 10,
      taskText: "Run",
      commentText: "note",
    });

    expect(result).toEqual({ updated: true });
    expect(updateSetMock).toHaveBeenCalledWith({
      taskText: "Run",
      commentText: "note",
    });
    expect(updateWhereMock).toHaveBeenCalled();
  });

  it("updatePlanEntryText должен возвращать not_found для отсутствующей тренировки", async () => {
    const selectFactory = createSelectFactory([[]]);
    dbSelectMock.mockImplementation(selectFactory);

    const result = await updatePlanEntryText({
      userId: 5,
      entryId: 99,
      taskText: "Run",
      commentText: null,
    });

    expect(result).toEqual({ error: "not_found" });
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });

  it("shiftPlanEntriesFromDate должен возвращать invalid_shift при некорректном сдвиге", async () => {
    const result = await shiftPlanEntriesFromDate({
      userId: 5,
      fromDate: "2026-01-01",
      offsetDays: 0,
    });

    expect(result).toEqual({ error: "invalid_shift" });
    expect(dbTransactionMock).not.toHaveBeenCalled();
  });

  it("shiftPlanEntriesFromDate должен возвращать not_found, если нечего сдвигать", async () => {
    const { tx } = createTx([[]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await shiftPlanEntriesFromDate({
      userId: 5,
      fromDate: "2026-01-01",
      offsetDays: 1,
    });

    expect(result).toEqual({ error: "not_found" });
  });

  it("shiftPlanEntriesFromDate должен запрещать сдвиг хвоста с отчетами", async () => {
    const { tx, updateWhereMock } = createTx([
      [
        { id: 1, date: "2026-01-10" },
        { id: 2, date: "2026-01-12" },
      ],
      [{ id: 20 }],
    ]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await shiftPlanEntriesFromDate({
      userId: 5,
      fromDate: "2026-01-10",
      offsetDays: 2,
    });

    expect(updateWhereMock).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "date_locked_by_report" });
  });

  it("shiftPlanEntriesFromDate должен запрещать сдвиг назад в занятый диапазон", async () => {
    const { tx, updateWhereMock } = createTx([[{ id: 2, date: "2026-01-10" }], [], [{ id: 1 }]]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await shiftPlanEntriesFromDate({
      userId: 5,
      fromDate: "2026-01-10",
      offsetDays: -2,
    });

    expect(updateWhereMock).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "target_date_exists" });
  });

  it("shiftPlanEntriesFromDate должен сдвигать хвост плана", async () => {
    const { tx, updateSetMock, updateWhereMock } = createTx([
      [
        { id: 1, date: "2026-01-10" },
        { id: 2, date: "2026-01-10" },
        { id: 3, date: "2026-01-12" },
      ],
      [],
    ]);
    dbTransactionMock.mockImplementation(async (callback: (t: any) => unknown) => {
      return await callback(tx);
    });

    const result = await shiftPlanEntriesFromDate({
      userId: 5,
      fromDate: "2026-01-10",
      offsetDays: 2,
    });

    expect(updateSetMock).toHaveBeenCalledTimes(1);
    expect(updateWhereMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      shifted: true,
      shiftedEntriesCount: 3,
      shiftedDaysCount: 2,
      fromDate: "2026-01-10",
      offsetDays: 2,
    });
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

  it("deletePlanEntriesForDate должен удалять день и возвращать удаленный", async () => {
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
