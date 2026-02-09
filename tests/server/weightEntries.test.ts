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

import { upsertWeightEntry } from "@/server/weightEntries";

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

describe("server/weightEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен обновлять существующую запись веса", async () => {
    mockSelectResult([{ id: 5 }]);

    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => {
      return {
        where: updateWhereMock,
      };
    });
    dbUpdateMock.mockReturnValue({
      set: updateSetMock,
    });

    await upsertWeightEntry({
      userId: 7,
      date: "2026-02-09",
      period: "morning",
      weightKg: 70.26,
    });

    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weightKg: "70.3",
      })
    );
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it("должен вставлять новую запись веса, когда существующая строка отсутствует", async () => {
    mockSelectResult([]);

    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    dbInsertMock.mockReturnValue({
      values: insertValuesMock,
    });

    await upsertWeightEntry({
      userId: 7,
      date: "2026-02-09",
      period: "evening",
      weightKg: 71,
    });

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        date: "2026-02-09",
        period: "evening",
        weightKg: "71.0",
      })
    );
  });
});
