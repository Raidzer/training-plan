import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbTransactionMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbTransactionMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      transaction: dbTransactionMock,
    },
  };
});

import {
  getClubRecords,
  getPersonalRecords,
  upsertPersonalRecords,
} from "@/server/personalRecords";

function mockSelectWhereResult(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
      innerJoin: vi.fn(() => {
        return {
          where: whereMock,
        };
      }),
    };
  });
  dbSelectMock.mockReturnValue({
    from: fromMock,
  });
}

describe("server/personalRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPersonalRecords должен нормализовать recordDate и nullable-поля", async () => {
    mockSelectWhereResult([
      {
        distanceKey: "10k",
        timeText: "00:36:20",
        recordDate: new Date("2026-01-10T00:00:00.000Z"),
        protocolUrl: null,
        raceName: null,
        raceCity: "Berlin",
      },
    ]);

    const result = await getPersonalRecords({ userId: 5 });

    expect(result).toEqual([
      {
        distanceKey: "10k",
        timeText: "00:36:20",
        recordDate: "2026-01-10",
        protocolUrl: null,
        raceName: null,
        raceCity: "Berlin",
      },
    ]);
  });

  it("getClubRecords должен маппить поля пользователя и фильтровать nullable-значения", async () => {
    mockSelectWhereResult([
      {
        id: 1,
        userId: 5,
        userName: "Ivan",
        userLastName: null,
        userGender: "male",
        distanceKey: "5k",
        timeText: "00:17:30",
        recordDate: new Date("2026-01-01T00:00:00.000Z"),
        protocolUrl: null,
        raceName: "City Run",
        raceCity: null,
      },
    ]);

    const result = await getClubRecords();

    expect(result).toEqual([
      {
        id: 1,
        userId: 5,
        userName: "Ivan",
        userLastName: null,
        userGender: "male",
        distanceKey: "5k",
        timeText: "00:17:30",
        recordDate: "2026-01-01",
        protocolUrl: null,
        raceName: "City Run",
        raceCity: null,
      },
    ]);
  });

  it("upsertPersonalRecords должен удалять пустые записи и делать upsert непустых записей", async () => {
    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    const deleteMock = vi.fn(() => {
      return {
        where: deleteWhereMock,
      };
    });
    const onConflictDoUpdateMock = vi.fn().mockResolvedValue(undefined);
    const insertValuesMock = vi.fn(() => {
      return {
        onConflictDoUpdate: onConflictDoUpdateMock,
      };
    });
    const insertMock = vi.fn(() => {
      return {
        values: insertValuesMock,
      };
    });
    dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback({
        delete: deleteMock,
        insert: insertMock,
      });
    });

    await upsertPersonalRecords({
      userId: 5,
      records: [
        {
          distanceKey: "10k",
          timeText: "   ",
          recordDate: null,
        },
        {
          distanceKey: "5k",
          timeText: " 00:17:30 ",
          recordDate: "2026-01-01",
          raceName: "City Run",
        },
      ],
    });

    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        distanceKey: "5k",
        timeText: "00:17:30",
        recordDate: "2026-01-01",
        raceName: "City Run",
      })
    );
    expect(onConflictDoUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("upsertPersonalRecords должен выбрасывать ошибку, когда непустая запись не имеет recordDate", async () => {
    dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback({
        delete: vi.fn(() => ({ where: vi.fn() })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({ onConflictDoUpdate: vi.fn() })),
        })),
      });
    });

    await expect(
      upsertPersonalRecords({
        userId: 5,
        records: [
          {
            distanceKey: "5k",
            timeText: "00:17:30",
            recordDate: "",
          },
        ],
      })
    ).rejects.toThrow("record_date_required");
  });
});
