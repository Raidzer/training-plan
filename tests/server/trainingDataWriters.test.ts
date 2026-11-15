import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, dbTransactionMock } = vi.hoisted(() => ({
  tx: { execute: vi.fn(), select: vi.fn() },
  dbTransactionMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  db: { ...tx, transaction: dbTransactionMock },
}));

import { clearUserTrainingDataById, deleteUserAccountById } from "@/server/adminUsers";
import {
  deletePlanEntriesForDate,
  shiftPlanEntriesFromDate,
  updatePlanEntryText,
  upsertPlanEntriesForDate,
} from "@/server/plans";
import { upsertRecoveryEntry } from "@/server/recoveryEntries";
import { upsertWeightEntry } from "@/server/weightEntries";
import { upsertWorkoutReport } from "@/server/workoutReports";

const USER_ID = 7;
const DATE = "2026-11-09";
const QUERY_AFTER_LOCK = new Error("query_after_lock");

const WRITERS = [
  [
    "план",
    () =>
      upsertPlanEntriesForDate({
        userId: USER_ID,
        date: DATE,
        originalDate: DATE,
        isWorkload: false,
        entries: [],
        isEdit: false,
      }),
  ],
  [
    "текст плана",
    () => updatePlanEntryText({ userId: USER_ID, entryId: 1, taskText: "Бег", commentText: null }),
  ],
  [
    "сдвиг плана",
    () => shiftPlanEntriesFromDate({ userId: USER_ID, fromDate: DATE, offsetDays: 1 }),
  ],
  ["удаление дня", () => deletePlanEntriesForDate({ userId: USER_ID, date: DATE })],
  [
    "отчёт",
    () =>
      upsertWorkoutReport({
        userId: USER_ID,
        planEntryId: 1,
        date: DATE,
        startTime: null,
        resultText: "OK",
      }),
  ],
  [
    "вес",
    () => upsertWeightEntry({ userId: USER_ID, date: DATE, period: "morning", weightKg: 70 }),
  ],
  [
    "восстановление",
    () =>
      upsertRecoveryEntry({
        userId: USER_ID,
        date: DATE,
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
      }),
  ],
  ["очистка", () => clearUserTrainingDataById(USER_ID)],
  ["удаление аккаунта", () => deleteUserAccountById(USER_ID)],
] as const;

describe("блокировка данных пользователя перед записью", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbTransactionMock.mockImplementation((callback: (executor: typeof tx) => Promise<unknown>) =>
      callback(tx)
    );
    tx.select.mockImplementation(() => {
      throw QUERY_AFTER_LOCK;
    });
  });

  it.each(WRITERS)("%s ожидает advisory lock до чтения данных", async (_, write) => {
    const lock = Promise.withResolvers<void>();
    tx.execute.mockResolvedValueOnce({}).mockReturnValueOnce(lock.promise);
    const pending = write().catch((error: unknown) => error);
    await Promise.resolve();
    await Promise.resolve();

    try {
      expect(tx.select).not.toHaveBeenCalled();
      expect(tx.execute).toHaveBeenCalledTimes(2);
      const dialect = new PgDialect();
      expect(dialect.sqlToQuery(tx.execute.mock.calls[0][0]).sql).toBe(
        "select set_config('lock_timeout', '5s', true)"
      );
      const advisoryQuery = dialect.sqlToQuery(tx.execute.mock.calls[1][0]);
      expect(advisoryQuery.sql).toBe("select pg_advisory_xact_lock($1::integer, $2::integer)");
      expect(advisoryQuery.params).toEqual([0x54524149, USER_ID]);
    } finally {
      lock.resolve();
    }

    expect(await pending).toBe(QUERY_AFTER_LOCK);
  });
});
