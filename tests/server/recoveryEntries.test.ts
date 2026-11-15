import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbUpdateMock, dbInsertMock, dbExecuteMock, dbTransactionMock } = vi.hoisted(
  () => {
    return {
      dbSelectMock: vi.fn(),
      dbUpdateMock: vi.fn(),
      dbInsertMock: vi.fn(),
      dbExecuteMock: vi.fn(),
      dbTransactionMock: vi.fn(),
    };
  }
);

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      update: dbUpdateMock,
      insert: dbInsertMock,
      transaction: dbTransactionMock,
    },
  };
});

import { getRecoveryEntryByDate, upsertRecoveryEntry } from "@/server/recoveryEntries";

function mockSelectResult(rows: unknown[]) {
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

describe("server/recoveryEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbExecuteMock.mockResolvedValue({});
    dbTransactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        execute: dbExecuteMock,
        select: dbSelectMock,
        insert: dbInsertMock,
        update: dbUpdateMock,
      })
    );
  });

  it("upsertRecoveryEntry должен обновлять существующую запись", async () => {
    mockSelectResult([{ id: 4 }]);
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => {
      return {
        where: updateWhereMock,
      };
    });
    dbUpdateMock.mockReturnValue({
      set: updateSetMock,
    });

    await upsertRecoveryEntry({
      userId: 5,
      date: "2026-02-09",
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      recoveryOther: "Контрастный душ",
      sleepHours: 7.5,
      additionalSleepHours: 0.58,
    });

    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasBath: true,
        hasMfr: false,
        hasMassage: true,
        recoveryOther: "Контрастный душ",
        sleepHours: "7.5",
        additionalSleepHours: "0.58",
      })
    );
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it("upsertRecoveryEntry должен вставлять новую запись", async () => {
    mockSelectResult([]);
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    dbInsertMock.mockReturnValue({
      values: insertValuesMock,
    });

    await upsertRecoveryEntry({
      userId: 5,
      date: "2026-02-09",
      hasBath: false,
      hasMfr: true,
      hasMassage: false,
      recoveryOther: null,
      sleepHours: null,
      additionalSleepHours: null,
    });

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        date: "2026-02-09",
        hasBath: false,
        hasMfr: true,
        hasMassage: false,
        recoveryOther: null,
        sleepHours: null,
        additionalSleepHours: null,
      })
    );
  });

  it("обновление сна не изменяет непереданные флаги восстановления", async () => {
    mockSelectResult([{ id: 4 }]);
    const updateSetMock = vi.fn<(values: unknown) => unknown>(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    }));
    dbUpdateMock.mockReturnValue({ set: updateSetMock });

    await upsertRecoveryEntry({ userId: 5, date: "2026-02-09", sleepHours: 7.5 });

    expect(updateSetMock).toHaveBeenCalledWith({
      sleepHours: "7.5",
      updatedAt: expect.any(Date),
    });
    expect(updateSetMock.mock.calls[0][0]).not.toHaveProperty("hasBath");
    expect(updateSetMock.mock.calls[0][0]).not.toHaveProperty("hasMfr");
    expect(updateSetMock.mock.calls[0][0]).not.toHaveProperty("hasMassage");
  });

  it("новая запись сна получает false для непереданных флагов", async () => {
    mockSelectResult([]);
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    dbInsertMock.mockReturnValue({ values: insertValuesMock });

    await upsertRecoveryEntry({ userId: 5, date: "2026-02-09", sleepHours: 8 });

    expect(insertValuesMock).toHaveBeenCalledWith({
      userId: 5,
      date: "2026-02-09",
      hasBath: false,
      hasMfr: false,
      hasMassage: false,
      sleepHours: "8",
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it("getRecoveryEntryByDate должен возвращать элемент или null", async () => {
    mockSelectResult([
      {
        id: 10,
        date: "2026-02-09",
        hasBath: true,
        hasMfr: false,
        hasMassage: true,
        recoveryOther: "Контрастный душ",
        sleepHours: "8",
        additionalSleepHours: "0.58",
      },
    ]);

    const entry = await getRecoveryEntryByDate({
      userId: 5,
      date: "2026-02-09",
    });
    expect(entry).toEqual({
      id: 10,
      date: "2026-02-09",
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      recoveryOther: "Контрастный душ",
      sleepHours: "8",
      additionalSleepHours: "0.58",
    });

    mockSelectResult([]);
    const empty = await getRecoveryEntryByDate({
      userId: 5,
      date: "2026-02-09",
    });
    expect(empty).toBeNull();
  });
});
