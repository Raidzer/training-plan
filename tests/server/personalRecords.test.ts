import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const { dbSelectMock, dbTransactionMock, dbInsertMock, dbUpdateMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbTransactionMock: vi.fn(),
    dbInsertMock: vi.fn(),
    dbUpdateMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      transaction: dbTransactionMock,
      insert: dbInsertMock,
      update: dbUpdateMock,
    },
  };
});

import {
  getClubRecords,
  getPersonalRecords,
  improvePersonalRecord,
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

describe("improvePersonalRecord", () => {
  const record = {
    distanceKey: "10k" as const,
    timeText: "39:30,1",
    recordDate: "2026-10-28",
    raceName: "Новый старт",
  };
  const returningMock = vi.fn();
  const updateWhereMock = vi.fn();
  const updateSetMock = vi.fn();
  const insertValuesMock = vi.fn();
  const onConflictDoNothingMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    returningMock.mockResolvedValue([{ id: 12 }]);
    updateWhereMock.mockReturnValue({ returning: returningMock });
    updateSetMock.mockReturnValue({ where: updateWhereMock });
    dbUpdateMock.mockReturnValue({ set: updateSetMock });
    onConflictDoNothingMock.mockReturnValue({ returning: returningMock });
    insertValuesMock.mockReturnValue({ onConflictDoNothing: onConflictDoNothingMock });
    dbInsertMock.mockReturnValue({ values: insertValuesMock });
  });

  it("создаёт первый рекорд с нормализованным временем и пустыми прежними метаданными", async () => {
    mockSelectWhereResult([]);

    expect(await improvePersonalRecord({ userId: 5, record })).toBe("updated");

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        distanceKey: "10k",
        timeText: "00:39:30.10",
        recordDate: "2026-10-28",
        raceName: "Новый старт",
        raceCity: null,
        protocolUrl: null,
      })
    );
    expect(onConflictDoNothingMock).toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });

  it("обновляет улучшенный рекорд только владельца и только при прежнем времени", async () => {
    mockSelectWhereResult([{ id: 12, timeText: "40:00" }]);

    expect(await improvePersonalRecord({ userId: 5, record })).toBe("updated");

    expect(dbInsertMock).not.toHaveBeenCalled();
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        timeText: "00:39:30.10",
        recordDate: "2026-10-28",
        raceName: "Новый старт",
        raceCity: null,
        protocolUrl: null,
      })
    );
    const condition = new PgDialect().sqlToQuery(updateWhereMock.mock.calls[0][0]);
    expect(condition.sql).toContain('"personal_records"."user_id" =');
    expect(condition.sql).toContain('"personal_records"."distance_key" =');
    expect(condition.sql).toContain('"personal_records"."time_text" =');
    expect(condition.params).toEqual(expect.arrayContaining([5, "10k", "40:00"]));
  });

  it.each(["39:30.10", "00:39:30.1", "00:39:30.09"])(
    "не перезаписывает равный или более быстрый рекорд %s",
    async (timeText) => {
      mockSelectWhereResult([{ id: 12, timeText }]);

      expect(await improvePersonalRecord({ userId: 5, record })).toBe("not_better");
      expect(dbUpdateMock).not.toHaveBeenCalled();
      expect(dbInsertMock).not.toHaveBeenCalled();
    }
  );

  it.each(["00:00", "DNF", "99:99"])(
    "не заменяет прежний рекорд с некорректным временем %s",
    async (timeText) => {
      mockSelectWhereResult([{ id: 12, timeText }]);

      expect(await improvePersonalRecord({ userId: 5, record })).toBe("invalid_current_record");
      expect(dbUpdateMock).not.toHaveBeenCalled();
      expect(dbInsertMock).not.toHaveBeenCalled();
    }
  );

  it.each([false, true])(
    "сообщает о конфликте при параллельной записи (существующий рекорд: %s)",
    async (hasCurrentRecord) => {
      mockSelectWhereResult(hasCurrentRecord ? [{ id: 12, timeText: "40:00" }] : []);
      returningMock.mockResolvedValue([]);

      expect(await improvePersonalRecord({ userId: 5, record })).toBe("conflict");
      expect(returningMock).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["", "00:00", "DNF"])("отклоняет новое невалидное время %s", async (timeText) => {
    await expect(
      improvePersonalRecord({ userId: 5, record: { ...record, timeText } })
    ).rejects.toThrow("invalid_time");
    expect(dbSelectMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });

  it("отклоняет новый рекорд без даты до обращения к БД", async () => {
    await expect(
      improvePersonalRecord({ userId: 5, record: { ...record, recordDate: null } })
    ).rejects.toThrow("record_date_required");
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("передаёт ошибку БД вызывающему коду", async () => {
    mockSelectWhereResult([]);
    returningMock.mockRejectedValueOnce(new Error("database_unavailable"));

    await expect(improvePersonalRecord({ userId: 5, record })).rejects.toThrow(
      "database_unavailable"
    );
  });
});
