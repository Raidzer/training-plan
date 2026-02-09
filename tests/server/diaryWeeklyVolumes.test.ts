import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
    },
  };
});

import { getDiaryWeeklyVolumesBySunday } from "@/server/diary";

function createSelectWhereBuilder(rows: unknown[]) {
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

describe("server/diary getDiaryWeeklyVolumesBySunday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать пустую карту и не обращаться к db для невалидной календарной даты", async () => {
    const result = await getDiaryWeeklyVolumesBySunday({
      userId: 1,
      from: "2026-02-31",
      to: "2026-03-02",
    });

    expect(result.size).toBe(0);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("должен агрегировать объем по воскресенью недели для валидного диапазона", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          { id: 101, date: "2026-01-27" },
          { id: 102, date: "2026-01-31" },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          { planEntryId: 101, distanceKm: "12.50" },
          { planEntryId: 102, distanceKm: "3.50" },
        ])
      );

    const result = await getDiaryWeeklyVolumesBySunday({
      userId: 1,
      from: "2026-01-27",
      to: "2026-01-31",
    });

    expect(dbSelectMock).toHaveBeenCalledTimes(2);
    expect(result.get("2026-02-01")).toBe(16);
  });
});
