import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbUpdateMock, dbInsertMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbUpdateMock: vi.fn(),
    dbInsertMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      update: dbUpdateMock,
      insert: dbInsertMock,
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
      sleepHours: 7.5,
    });

    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasBath: true,
        hasMfr: false,
        hasMassage: true,
        sleepHours: "7.5",
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
      sleepHours: null,
    });

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        date: "2026-02-09",
        hasBath: false,
        hasMfr: true,
        hasMassage: false,
        sleepHours: null,
      })
    );
  });

  it("getRecoveryEntryByDate должен возвращать элемент или null", async () => {
    mockSelectResult([
      {
        id: 10,
        date: "2026-02-09",
        hasBath: true,
        hasMfr: false,
        hasMassage: true,
        sleepHours: "8",
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
      sleepHours: "8",
    });

    mockSelectResult([]);
    const empty = await getRecoveryEntryByDate({
      userId: 5,
      date: "2026-02-09",
    });
    expect(empty).toBeNull();
  });
});
