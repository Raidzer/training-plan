import { beforeEach, describe, expect, it, vi } from "vitest";
import type { db } from "@/server/db/client";

const { dbSelectMock } = vi.hoisted(() => ({ dbSelectMock: vi.fn() }));

vi.mock("@/server/db/client", () => ({ db: { select: dbSelectMock } }));

import {
  getDiaryExportRows,
  getDiaryWeeklyVolumesBySunday,
  getFullDiaryDateRange,
} from "@/server/diary";
import { listCompetitionBlocksByUser } from "@/server/competitions";
import { getPersonalRecords } from "@/server/personalRecords";
import { getUserProfileById } from "@/server/services/users";
import { getLatestWeightEntry } from "@/server/weightEntries";

function createExecutor(...results: unknown[][]): Pick<typeof db, "select"> {
  const select = () => {
    const rows = results.shift();
    if (!rows) {
      throw new Error("Неожиданный запрос в снимке");
    }
    const promise = Promise.resolve(rows);
    const builder = {
      from: () => builder,
      where: () => builder,
      leftJoin: () => builder,
      innerJoin: () => builder,
      orderBy: () => builder,
      limit: () => builder,
      then: promise.then.bind(promise),
    };
    return builder;
  };
  return { select } as unknown as Pick<typeof db, "select">;
}

describe("getters экспорта используют переданный снимок вместо глобальной БД", () => {
  beforeEach(() => {
    dbSelectMock.mockImplementation(() => {
      throw new Error("Чтение вне снимка");
    });
  });

  it("определяет полный диапазон через executor", async () => {
    const executor = createExecutor([{ minDate: "2025-01-01", maxDate: "2026-02-01" }]);

    await expect(getFullDiaryDateRange({ userId: 7 }, executor)).resolves.toEqual({
      from: "2025-01-01",
      to: "2026-02-01",
    });
  });

  it("читает план, отчёты, обувь, вес и восстановление через executor", async () => {
    const executor = createExecutor(
      [{ id: 1, date: "2026-02-01", sessionOrder: 1, taskText: "Кросс", isWorkload: true }],
      [{ id: 10, planEntryId: 1, resultText: "Готово", distanceKm: "12.5" }],
      [{ reportId: 10, shoeId: 3, shoeName: "Pegasus", mileageKm: "12.5" }],
      [{ date: "2026-02-01", period: "morning", weightKg: "70.4" }],
      [{ date: "2026-02-01", hasBath: true, hasMfr: false, hasMassage: false, sleepHours: "7.5" }]
    );

    const rows = await getDiaryExportRows(
      { userId: 7, from: "2026-02-01", to: "2026-02-01" },
      executor
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      task: "Кросс",
      result: "Готово",
      comment: "Pegasus",
      weight: "70.4 / -",
      sleep: "07:30",
      recovery: "Баня",
      volume: "12.50",
      hasWorkload: true,
    });
  });

  it("читает план и отчёты недельных итогов через executor", async () => {
    const executor = createExecutor(
      [{ id: 1, date: "2026-01-27", taskText: "Кросс" }],
      [{ planEntryId: 1, distanceKm: "12.5" }]
    );

    const volumes = await getDiaryWeeklyVolumesBySunday(
      { userId: 7, from: "2026-01-27", to: "2026-01-31" },
      executor
    );

    expect([...volumes]).toEqual([["2026-02-01", 12.5]]);
  });

  it("читает профиль через executor", async () => {
    const profile = { id: 7, name: "Иван" };

    await expect(getUserProfileById(7, createExecutor([profile]))).resolves.toEqual(profile);
  });

  it("читает рекорды через executor", async () => {
    const executor = createExecutor([
      { distanceKey: "10k", timeText: "37:32", recordDate: "2026-05-23" },
    ]);

    await expect(getPersonalRecords({ userId: 7 }, executor)).resolves.toEqual([
      {
        distanceKey: "10k",
        timeText: "37:32",
        recordDate: "2026-05-23",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
    ]);
  });

  it("читает блоки и вложенные соревнования через один executor", async () => {
    const executor = createExecutor(
      [{ id: 1, title: "Весна", startDate: "2026-03-01", endDate: "2026-05-31" }],
      [{ id: 10, blockId: 1, date: "2026-04-26", nameLocation: "Москва", priority: "main" }]
    );

    await expect(listCompetitionBlocksByUser(7, executor)).resolves.toEqual([
      expect.objectContaining({
        id: 1,
        competitions: [expect.objectContaining({ id: 10, nameLocation: "Москва" })],
      }),
    ]);
  });

  it("читает последний вес через executor", async () => {
    await expect(
      getLatestWeightEntry({ userId: 7 }, createExecutor([{ weightKg: "70.4" }]))
    ).resolves.toBe("70.4");
  });
});
