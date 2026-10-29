import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  improve: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ db: mocks }));
vi.mock("@/server/personalRecords", () => ({ improvePersonalRecord: mocks.improve }));

import {
  claimCompetitionResultRequest,
  confirmCompetitionResultRecord,
  findCompetitionResultRequestByPrompt,
  getCompetitionResultRequest,
  listDueCompetitions,
  markCompetitionResultRequestSent,
  releaseCompetitionResultRequestClaim,
  saveCompetitionResult,
  setCompetitionResultPrompt,
  skipCompetitionResult,
} from "@/server/competitionResultRequests";

const NOW = new Date("2026-10-29T07:00:00.000Z");
const COMPETITION = {
  id: 2,
  blockId: 3,
  date: "2026-10-28",
  nameLocation: "Осенний старт",
  distanceMeters: 10000,
  distanceLabel: "10 км",
  priority: "main",
  result: null,
  isSkipped: false,
  sortOrder: 0,
  createdAt: NOW,
  updatedAt: NOW,
};
const REQUEST = {
  id: 4,
  userId: 1,
  chatId: 100,
  telegramAccountId: 5,
  competitionId: 2,
  competitionDate: "2026-10-28",
  sentAt: NOW,
  promptMessageId: 50,
  leaseToken: null,
  leaseExpiresAt: null,
  resultSnapshot: { ...COMPETITION, updatedAt: NOW.toISOString() },
  createdAt: NOW,
};
const PARAMS = { requestId: 4, chatId: 100 };

function selectRows(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn((_condition: SQL) => builder),
    orderBy: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    for: vi.fn(() => builder),
    then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  };
  mocks.select.mockReturnValueOnce(builder);
  return builder;
}

function updateRows(rows: unknown[]) {
  const builder = {
    set: vi.fn((_values: unknown) => builder),
    where: vi.fn((_condition: SQL) => builder),
    returning: vi.fn().mockResolvedValue(rows),
    then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  };
  mocks.update.mockReturnValueOnce(builder);
  return builder;
}

function conditionSql(value: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return new PgDialect().sqlToQuery(value);
}

describe("competitionResultRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback) => callback(mocks));
    mocks.improve.mockResolvedValue("updated");
  });

  it("выбирает только пустые непропущенные соревнования активного привязанного подписчика", async () => {
    const query = selectRows([COMPETITION]);
    expect(await listDueCompetitions({ userId: 1, chatId: 100, date: "2026-10-28" })).toEqual([
      COMPETITION,
    ]);
    const compiled = conditionSql(query.where.mock.calls[0][0]);
    for (const name of ["is_active", "chat_id", "enabled", "is_skipped", "result", "date"]) {
      expect(compiled.sql).toContain(name);
    }
    expect(compiled.params).toContain("2026-10-28");
  });

  it("не захватывает отправку для недействующего источника", async () => {
    selectRows([]);
    expect(
      await claimCompetitionResultRequest({
        userId: 1,
        chatId: 100,
        competitionId: 2,
        date: "2026-10-28",
      })
    ).toBeNull();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("захват защищён sentAt и истекающим lease, не зависит от отправки плана", async () => {
    selectRows([{ competition: COMPETITION, telegramAccountId: 5 }]);
    const insert = {
      values: vi.fn(() => insert),
      onConflictDoUpdate: vi.fn((_options: { setWhere: SQL }) => insert),
      returning: vi.fn().mockResolvedValue([{ id: 4, leaseToken: "token" }]),
    };
    mocks.insert.mockReturnValueOnce(insert);
    expect(
      await claimCompetitionResultRequest({
        userId: 1,
        chatId: 100,
        competitionId: 2,
        date: "2026-10-28",
      })
    ).toMatchObject({ id: 4, leaseToken: "token", competition: COMPETITION });
    const compiled = conditionSql(insert.onConflictDoUpdate.mock.calls[0][0].setWhere);
    expect(compiled.sql).toContain("sent_at");
    expect(compiled.sql).toContain("lease_expires_at");
    expect(compiled.sql).not.toContain("last_sent_on");
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        resultSnapshot: expect.objectContaining({
          result: null,
          distanceLabel: "10 км",
          nameLocation: "Осенний старт",
          updatedAt: NOW.toISOString(),
        }),
      })
    );
  });

  it("запрос без исходного снимка считается устаревшим", async () => {
    selectRows([{ request: { ...REQUEST, resultSnapshot: null }, competition: COMPETITION }]);
    expect(await getCompetitionResultRequest(PARAMS)).toBeNull();
  });

  it("исходный пустой снимок не позволяет подтвердить рекорд до записи результата", async () => {
    selectRows([{ request: REQUEST, competition: COMPETITION }]);
    expect(await confirmCompetitionResultRecord(PARAMS)).toBe("stale");
    expect(mocks.improve).not.toHaveBeenCalled();
  });

  it.each([
    { distanceLabel: "5 км", distanceMeters: 5000 },
    { nameLocation: "Другой старт" },
    { updatedAt: new Date("2026-10-29T07:00:01.000Z") },
  ])("отклоняет ввод после изменения исходного соревнования %j", async (changed) => {
    selectRows([{ request: REQUEST, competition: { ...COMPETITION, ...changed } }]);
    expect(await saveCompetitionResult({ ...PARAMS, result: "39:30" })).toBeNull();
    selectRows([{ request: REQUEST, competition: { ...COMPETITION, ...changed } }]);
    expect(await skipCompetitionResult(PARAMS)).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("завершение и освобождение отправки требуют свой lease token", async () => {
    const sent = updateRows([{ id: 4 }]);
    expect(await markCompetitionResultRequestSent({ requestId: 4, leaseToken: "mine" })).toBe(true);
    expect(conditionSql(sent.where.mock.calls[0][0]).params).toContain("mine");
    const release = updateRows([]);
    await releaseCompetitionResultRequestClaim({ requestId: 4, leaseToken: "mine" });
    expect(conditionSql(release.where.mock.calls[0][0]).params).toContain("mine");
  });

  it("чтение повторно проверяет владельца, активность, дату и идентичность Telegram-привязки", async () => {
    const query = selectRows([{ request: REQUEST, competition: COMPETITION }]);
    expect(await getCompetitionResultRequest(PARAMS)).toMatchObject({
      id: 4,
      userId: 1,
      competition: COMPETITION,
    });
    const compiled = conditionSql(query.where.mock.calls[0][0]);
    for (const name of [
      "is_active",
      "chat_id",
      "competition_date",
      "telegram_account_id",
      "user_id",
      "sent_at",
    ]) {
      expect(compiled.sql).toContain(name);
    }
  });

  it("различает чужой reply и известное устаревшее приглашение", async () => {
    selectRows([]);
    expect(
      await findCompetitionResultRequestByPrompt({ chatId: 100, promptMessageId: 999 })
    ).toBeNull();
    selectRows([{ id: 4 }]);
    selectRows([]);
    expect(
      await findCompetitionResultRequestByPrompt({ chatId: 100, promptMessageId: 50 })
    ).toEqual({ id: 4, request: null });
  });

  it("сохраняет ForceReply только для ещё пустого соревнования", async () => {
    selectRows([{ request: REQUEST, competition: { ...COMPETITION, isSkipped: true } }]);
    expect(await setCompetitionResultPrompt({ ...PARAMS, promptMessageId: 51 })).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
    selectRows([{ request: REQUEST, competition: COMPETITION }]);
    const update = updateRows([{ id: 4 }]);
    expect(await setCompetitionResultPrompt({ ...PARAMS, promptMessageId: 51 })).toBe(true);
    expect(update.set).toHaveBeenCalledWith({ promptMessageId: 51 });
  });

  it("пропуск условный: конкурирующая запись результата остаётся целой", async () => {
    selectRows([{ request: REQUEST, competition: COMPETITION }]);
    const update = updateRows([]);
    expect(await skipCompetitionResult(PARAMS)).toBeNull();
    const compiled = conditionSql(update.where.mock.calls[0][0]);
    expect(compiled.sql).toContain("is_skipped");
    expect(compiled.sql).toContain("result");
    expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ isSkipped: true }));
  });

  it.each(["00:00", "DNF", "99:99", ""])(
    "отклоняет невалидное время %s до записи",
    async (result) => {
      await expect(saveCompetitionResult({ ...PARAMS, result })).rejects.toThrow("invalid_time");
      expect(mocks.update).not.toHaveBeenCalled();
    }
  );

  it("сохраняет нормализованный результат и снимок в одной транзакции", async () => {
    selectRows([{ request: REQUEST, competition: COMPETITION }]);
    const competition = { ...COMPETITION, result: "00:39:30.10" };
    updateRows([competition]);
    const snapshot = updateRows([{ id: 4 }]);
    expect(await saveCompetitionResult({ ...PARAMS, result: "39:30,1" })).toMatchObject({
      savedResult: "00:39:30.10",
      competition,
    });
    expect(snapshot.set).toHaveBeenCalledWith(
      expect.objectContaining({
        resultSnapshot: expect.objectContaining({
          result: "00:39:30.10",
          nameLocation: "Осенний старт",
        }),
      })
    );
    expect(mocks.improve).not.toHaveBeenCalled();
  });

  it("повторный результат не заменяет уже заполненный старт", async () => {
    selectRows([{ request: REQUEST, competition: { ...COMPETITION, result: "40:00" } }]);
    expect(await saveCompetitionResult({ ...PARAMS, result: "39:30" })).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("устаревший снимок не сохраняет рекорд", async () => {
    selectRows([
      {
        request: { ...REQUEST, resultSnapshot: { ...COMPETITION, result: "39:30" } },
        competition: { ...COMPETITION, result: "40:00" },
      },
    ]);
    expect(await confirmCompetitionResultRecord(PARAMS)).toBe("stale");
    expect(mocks.improve).not.toHaveBeenCalled();
  });

  it("подтверждение блокирует источник и сохраняет рекорд в той же транзакции", async () => {
    const competition = { ...COMPETITION, result: "00:39:30" };
    const query = selectRows([
      {
        request: { ...REQUEST, resultSnapshot: { ...competition, updatedAt: NOW.toISOString() } },
        competition,
      },
    ]);
    expect(await confirmCompetitionResultRecord(PARAMS)).toBe("updated");
    expect(query.for).toHaveBeenCalled();
    expect(mocks.improve).toHaveBeenCalledWith(
      {
        userId: 1,
        record: {
          distanceKey: "10k",
          timeText: "00:39:30",
          recordDate: "2026-10-28",
          raceName: "Осенний старт",
          raceCity: null,
          protocolUrl: null,
        },
      },
      mocks
    );
  });
});
