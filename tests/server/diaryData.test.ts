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

import { getDiaryDayData } from "@/server/diary";

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

function createSelectWhereOrderByBuilder(rows: unknown[]) {
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

describe("server/diary getDiaryDayData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("не должен считать плейсхолдер '-' тренировкой", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectWhereOrderByBuilder([
          {
            id: 100,
            date: "2026-05-30",
            sessionOrder: 1,
            taskText: "-",
            commentText: null,
            isWorkload: false,
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            id: 1,
            date: "2026-05-30",
            period: "morning",
            weightKg: "71.50",
          },
          {
            id: 2,
            date: "2026-05-30",
            period: "evening",
            weightKg: "73.00",
          },
        ])
      )
      .mockReturnValueOnce(createSelectWhereBuilder([]))
      .mockReturnValueOnce(createSelectWhereBuilder([]));

    const result = await getDiaryDayData({
      userId: 7,
      date: "2026-05-30",
    });

    expect(result.planEntries).toEqual([]);
    expect(result.workoutReports).toEqual([]);
    expect(result.status).toMatchObject({
      workoutsTotal: 0,
      workoutsWithFullReport: 0,
      dayHasReport: true,
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(4);
  });
});
