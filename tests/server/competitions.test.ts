import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

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
  createCompetitionBlock,
  deleteCompetition,
  listCompetitionBlocksByUser,
  updateCompetition,
} from "@/server/competitions";

function createSelectOrderBuilder(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    orderBy: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

function createSelectWhereBuilder(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

function createSelectLimitBuilder(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

function createInsertBuilder(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const valuesMock = vi.fn(() => ({
    returning: returningMock,
  }));

  dbInsertMock.mockReturnValue({
    values: valuesMock,
  });

  return { valuesMock, returningMock };
}

function createDeleteBuilder(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn(() => ({
    returning: returningMock,
  }));

  dbDeleteMock.mockReturnValue({
    where: whereMock,
  });

  return { whereMock, returningMock };
}

describe("server/competitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listCompetitionBlocksByUser должен возвращать блоки с вложенными соревнованиями", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectOrderBuilder([
          {
            id: 10,
            title: "Весна",
            startDate: "2026-03-01",
            endDate: "2026-06-01",
            sortOrder: 0,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ])
      )
      .mockReturnValueOnce(
        createSelectOrderBuilder([
          {
            id: 20,
            blockId: 10,
            date: "2026-05-10",
            nameLocation: "Москва",
            distanceMeters: 10000,
            distanceLabel: "10 км",
            priority: COMPETITION_PRIORITIES.MAIN,
            result: "39:30",
            sortOrder: 0,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ])
      );

    const result = await listCompetitionBlocksByUser(7);

    expect(result).toHaveLength(1);
    expect(result[0].competitions).toHaveLength(1);
    expect(result[0].competitions[0]).toMatchObject({
      id: 20,
      priority: COMPETITION_PRIORITIES.MAIN,
    });
  });

  it("createCompetitionBlock должен ставить следующий sortOrder", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectWhereBuilder([{ sortOrder: 3 }]));
    const { valuesMock } = createInsertBuilder([
      {
        id: 11,
        title: "Осень",
        startDate: "2026-08-01",
        endDate: "2026-11-01",
        sortOrder: 3,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const result = await createCompetitionBlock({
      userId: 7,
      title: "Осень",
      startDate: "2026-08-01",
      endDate: "2026-11-01",
    });

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        title: "Осень",
        sortOrder: 3,
      })
    );
    expect(result?.competitions).toEqual([]);
  });

  it("updateCompetition не должен обновлять чужое соревнование", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectLimitBuilder([]));

    const result = await updateCompetition({
      userId: 7,
      competitionId: 20,
      result: "39:30",
    });

    expect(result).toBeNull();
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });

  it("deleteCompetition должен удалять соревнование после проверки владельца", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectLimitBuilder([{ id: 20, blockId: 10 }]));
    createDeleteBuilder([{ id: 20 }]);

    const result = await deleteCompetition({ userId: 7, competitionId: 20 });

    expect(result).toBe(true);
    expect(dbDeleteMock).toHaveBeenCalledTimes(1);
  });
});
