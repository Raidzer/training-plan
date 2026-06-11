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

import {
  getDiaryDayData,
  getDiaryDaysInRange,
  getDiaryExportRows,
  getFullDiaryDateRange,
} from "@/server/diary";

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

function createSelectLeftJoinWhereBuilder(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const leftJoinMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });
  const fromMock = vi.fn(() => {
    return {
      leftJoin: leftJoinMock,
    };
  });

  return {
    from: fromMock,
  };
}

function createSelectInnerJoinWhereBuilder(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const innerJoinMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });
  const fromMock = vi.fn(() => {
    return {
      innerJoin: innerJoinMock,
    };
  });

  return {
    from: fromMock,
  };
}

describe("server/diary getFullDiaryDateRange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен собирать общий диапазон дневника из плана", async () => {
    dbSelectMock.mockReturnValueOnce(
      createSelectWhereBuilder([{ minDate: "2025-10-13", maxDate: "2026-06-15" }])
    );

    const result = await getFullDiaryDateRange({ userId: 7 });

    expect(result).toEqual({
      from: "2025-10-13",
      to: "2026-06-15",
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(1);
  });

  it("должен возвращать null, если в плане нет дат", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([{ minDate: null, maxDate: null }]));

    const result = await getFullDiaryDateRange({ userId: 7 });

    expect(result).toBeNull();
  });
});

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

  it("должен собирать день с отчетом, восстановлением, весом и обувью", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectWhereOrderByBuilder([
          {
            id: 100,
            date: "2026-05-30",
            sessionOrder: 1,
            taskText: "Кросс 10 км",
            commentText: "Легко",
            isWorkload: true,
          },
          {
            id: 101,
            date: "2026-05-30",
            sessionOrder: 2,
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
            weightKg: "72.00",
          },
        ])
      )
      .mockReturnValueOnce(createSelectWhereBuilder([{ weightKg: "72.30" }]))
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            id: 5,
            date: "2026-05-30",
            hasBath: true,
            hasMfr: true,
            hasMassage: false,
            recoveryOther: "Контрастный душ",
            sleepHours: "7.5",
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectLeftJoinWhereBuilder([
          {
            id: 200,
            planEntryId: 100,
            date: "2026-05-30",
            startTime: "09:00",
            resultText: "10 км",
            commentText: "Ровно",
            distanceKm: "10.50",
            overallScore: 8,
            functionalScore: 7,
            muscleScore: 6,
            weather: "sunny",
            hasWind: true,
            temperatureC: "20",
            surface: "asphalt",
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectInnerJoinWhereBuilder([
          {
            reportId: 200,
            shoeId: 7,
            shoeName: "Pegasus",
            mileageKm: "120.50",
          },
        ])
      );

    const result = await getDiaryDayData({
      userId: 7,
      date: "2026-05-30",
    });

    expect(result.planEntries).toHaveLength(1);
    expect(result.weightEntries).toHaveLength(2);
    expect(result.recoveryEntry).toMatchObject({
      hasBath: true,
      hasMfr: true,
      hasMassage: false,
      recoveryOther: "Контрастный душ",
    });
    expect(result.previousEveningWeightKg).toBe("72.30");
    expect(result.workoutReports[0]).toMatchObject({
      id: 200,
      planEntryId: 100,
      distanceKm: "10.50",
      shoes: [{ id: 7, name: "Pegasus", mileageKm: "120.50" }],
    });
    expect(result.status).toMatchObject({
      workoutsTotal: 1,
      workoutsWithFullReport: 1,
      dayHasReport: true,
      totalDistanceKm: 10.5,
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(6);
  });
});

describe("server/diary getDiaryDaysInRange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен агрегировать статусы дней и добавлять пустые даты диапазона", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          { id: 1, date: "2026-02-01", taskText: "Кросс 7 км" },
          { id: 2, date: "2026-02-02", taskText: "-" },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          { date: "2026-02-01", period: "morning" },
          { date: "2026-02-01", period: "evening" },
          { date: "2026-02-02", period: "morning" },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            date: "2026-02-02",
            hasBath: true,
            hasMfr: false,
            hasMassage: true,
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            planEntryId: 1,
            resultText: "7 км",
            commentText: "готово",
            distanceKm: "7.25",
          },
        ])
      );

    const result = await getDiaryDaysInRange({
      userId: 7,
      from: "2026-02-01",
      to: "2026-02-03",
      includeEmpty: true,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      date: "2026-02-01",
      workoutsTotal: 1,
      workoutsWithFullReport: 1,
      hasWeightMorning: true,
      hasWeightEvening: true,
      dayHasReport: true,
      totalDistanceKm: 7.25,
    });
    expect(result[1]).toMatchObject({
      date: "2026-02-02",
      workoutsTotal: 0,
      hasBath: true,
      hasMassage: true,
      dayHasReport: false,
    });
    expect(result[2]).toMatchObject({
      date: "2026-02-03",
      workoutsTotal: 0,
      hasWeightMorning: false,
      hasWeightEvening: false,
    });
  });
});

describe("server/diary getDiaryExportRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен формировать строки экспорта с тренировками, весом и восстановлением", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectWhereOrderByBuilder([
          {
            id: 1,
            date: "2026-02-01",
            sessionOrder: 1,
            taskText: "Кросс 10 км",
            isWorkload: true,
          },
          {
            id: 2,
            date: "2026-02-01",
            sessionOrder: 2,
            taskText: "Заминка",
            isWorkload: false,
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectLeftJoinWhereBuilder([
          {
            id: 10,
            planEntryId: 1,
            startTime: "08:30",
            resultText: "10 км",
            commentText: "ровно",
            distanceKm: "10",
            overallScore: 8,
            functionalScore: 7,
            muscleScore: 6,
            weather: "sunny",
            hasWind: true,
            temperatureC: "18.2",
            surface: "asphalt",
          },
          {
            id: 11,
            planEntryId: 2,
            startTime: null,
            resultText: "",
            commentText: null,
            distanceKm: null,
            overallScore: null,
            functionalScore: null,
            muscleScore: null,
            weather: null,
            hasWind: null,
            temperatureC: null,
            surface: null,
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectInnerJoinWhereBuilder([
          {
            reportId: 10,
            shoeId: 3,
            shoeName: "Pegasus",
            mileageKm: "120.25",
          },
          {
            reportId: 10,
            shoeId: 4,
            shoeName: "Streak",
            mileageKm: null,
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          { date: "2026-02-01", period: "morning", weightKg: "70.4" },
          { date: "2026-02-01", period: "evening", weightKg: "71.1" },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            date: "2026-02-01",
            hasBath: true,
            hasMfr: false,
            hasMassage: true,
            recoveryOther: "Контрастный душ",
            sleepHours: "7.5",
          },
        ])
      );

    const result = await getDiaryExportRows({
      userId: 7,
      from: "2026-02-01",
      to: "2026-02-02",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      task: "1) Кросс 10 км\n2) Заминка",
      result: "1) 10 км\n2) -",
      score: "1) 8-7-6\n2) -",
      sleep: "07:30",
      weight: "70.4 / 71.1",
      recovery: "Баня, Массаж, Контрастный душ",
      volume: "10.00",
      hasWorkload: true,
    });
    expect(result[0].dateTime).toContain("08:30");
    expect(result[0].dateTime).not.toContain("null");
    expect(result[0].comment).toContain("18.2°C");
    expect(result[0].comment).toContain("Солнечно");
    expect(result[0].comment).toContain("ветер");
    expect(result[0].comment).toContain("Асфальт");
    expect(result[0].comment).toContain("Pegasus");
    expect(result[0].comment).toContain("Streak");
    expect(result[1]).toMatchObject({
      task: "-",
      result: "-",
      comment: "-",
      score: "-",
      volume: "-",
      hasWorkload: false,
    });
  });
});
