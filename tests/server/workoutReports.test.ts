import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbInsertMock, dbUpdateMock, dbDeleteMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbInsertMock: vi.fn(),
    dbUpdateMock: vi.fn(),
    dbDeleteMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      insert: dbInsertMock,
      update: dbUpdateMock,
      delete: dbDeleteMock,
    },
  };
});

import {
  areShoesOwnedByUser,
  getPlanEntrySummaryForUser,
  getWorkoutReportByPlanEntry,
  upsertWorkoutReport,
} from "@/server/workoutReports";

function createSelectWhereBuilder(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
      leftJoin: vi.fn(() => ({
        where: whereMock,
      })),
      innerJoin: vi.fn(() => ({
        where: whereMock,
      })),
    };
  });
  return {
    from: fromMock,
  };
}

describe("server/workoutReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPlanEntrySummaryForUser должен возвращать элемент или null", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([{ id: 11, date: "2026-02-09" }]));
    const present = await getPlanEntrySummaryForUser({ userId: 1, planEntryId: 11 });
    expect(present).toEqual({ id: 11, date: "2026-02-09" });

    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([]));
    const missing = await getPlanEntrySummaryForUser({ userId: 1, planEntryId: 11 });
    expect(missing).toBeNull();
  });

  it("areShoesOwnedByUser должен обрабатывать пустые и непустые списки", async () => {
    const empty = await areShoesOwnedByUser({ userId: 1, shoeIds: [] });
    expect(empty).toBe(true);
    expect(dbSelectMock).not.toHaveBeenCalled();

    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([{ id: 1 }]));
    const mismatch = await areShoesOwnedByUser({ userId: 1, shoeIds: [1, 2] });
    expect(mismatch).toBe(false);

    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([{ id: 1 }, { id: 2 }]));
    const ok = await areShoesOwnedByUser({ userId: 1, shoeIds: [1, 2] });
    expect(ok).toBe(true);
  });

  it("getWorkoutReportByPlanEntry должен возвращать отчет с кроссовками", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            id: 50,
            planEntryId: 11,
            date: "2026-02-09",
            startTime: "08:00",
            resultText: "OK",
            commentText: "Good",
            distanceKm: "10",
            overallScore: 8,
            functionalScore: 7,
            muscleScore: 7,
            weather: "sunny",
            hasWind: false,
            temperatureC: "5",
            surface: "asphalt",
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectWhereBuilder([
          {
            reportId: 50,
            shoeId: 1,
            shoeName: "Pegasus",
          },
        ])
      );

    const result = await getWorkoutReportByPlanEntry({ userId: 1, planEntryId: 11 });

    expect(result).toMatchObject({
      id: 50,
      planEntryId: 11,
      shoes: [{ id: 1, name: "Pegasus" }],
    });
  });

  it("upsertWorkoutReport должен обновлять существующий отчет", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([{ id: 99 }]));
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => ({
      where: updateWhereMock,
    }));
    dbUpdateMock.mockReturnValue({
      set: updateSetMock,
    });

    await upsertWorkoutReport({
      userId: 1,
      planEntryId: 11,
      date: "2026-02-09",
      startTime: "08:00",
      resultText: "OK",
      commentText: "Comment",
    });

    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-02-09",
        startTime: "08:00",
        resultText: "OK",
        commentText: "Comment",
      })
    );
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it("upsertWorkoutReport должен вставлять отчет, условия и кроссовки", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([]));

    const insertReportReturningMock = vi.fn().mockResolvedValue([{ id: 20 }]);
    const insertReportValuesMock = vi.fn(() => ({
      returning: insertReportReturningMock,
    }));
    const onConflictDoUpdateMock = vi.fn().mockResolvedValue(undefined);
    const insertConditionsValuesMock = vi.fn(() => ({
      onConflictDoUpdate: onConflictDoUpdateMock,
    }));
    const insertShoesValuesMock = vi.fn().mockResolvedValue(undefined);

    dbInsertMock
      .mockImplementationOnce(() => ({
        values: insertReportValuesMock,
      }))
      .mockImplementationOnce(() => ({
        values: insertConditionsValuesMock,
      }))
      .mockImplementationOnce(() => ({
        values: insertShoesValuesMock,
      }));

    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    dbDeleteMock.mockReturnValue({
      where: deleteWhereMock,
    });

    await upsertWorkoutReport({
      userId: 1,
      planEntryId: 11,
      date: "2026-02-09",
      startTime: "08:00",
      resultText: "OK",
      distanceKm: 10.5,
      weather: "sunny",
      hasWind: true,
      temperatureC: 5.2,
      surface: "asphalt",
      shoeIds: [1, 2],
    });

    expect(insertReportValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        planEntryId: 11,
        distanceKm: "10.5",
      })
    );
    expect(onConflictDoUpdateMock).toHaveBeenCalledTimes(1);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(insertShoesValuesMock).toHaveBeenCalledWith([
      expect.objectContaining({ workoutReportId: 20, shoeId: 1 }),
      expect.objectContaining({ workoutReportId: 20, shoeId: 2 }),
    ]);
  });
});
