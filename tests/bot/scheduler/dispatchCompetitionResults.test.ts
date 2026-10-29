import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscriptions: vi.fn(),
  listDue: vi.fn(),
  claim: vi.fn(),
  markSent: vi.fn(),
  release: vi.fn(),
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getEnabledSubscriptions: mocks.subscriptions,
}));
vi.mock("@/server/competitionResultRequests", () => ({
  listDueCompetitions: mocks.listDue,
  claimCompetitionResultRequest: mocks.claim,
  markCompetitionResultRequestSent: mocks.markSent,
  releaseCompetitionResultRequestClaim: mocks.release,
}));

import { dispatchCompetitionResults } from "@/bot/scheduler/dispatchCompetitionResults";

const subscription = {
  id: 1,
  userId: 10,
  chatId: 100,
  timezone: "Europe/Moscow",
  sendTime: "10:00",
};
const competition = {
  id: 20,
  date: "2026-10-28",
  nameLocation: "Осенний старт",
  distanceLabel: "10 км",
};

describe("рассылка запросов результата", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.subscriptions.mockResolvedValue([subscription]);
    mocks.listDue.mockResolvedValue([competition]);
    mocks.claim.mockResolvedValue({ id: 7, leaseToken: "lease-7", competition });
    mocks.markSent.mockResolvedValue(true);
    mocks.release.mockResolvedValue(undefined);
  });

  it("отправляет запрос вчерашнего старта в настроенное местное время", async () => {
    const bot = { api: { sendMessage: vi.fn().mockResolvedValue({ message_id: 33 }) } };
    await dispatchCompetitionResults(bot as any, new Date("2026-10-29T07:00:00Z"));
    expect(mocks.listDue).toHaveBeenCalledWith({ userId: 10, chatId: 100, date: "2026-10-28" });
    expect(mocks.claim).toHaveBeenCalledWith({
      userId: 10,
      chatId: 100,
      competitionId: 20,
      date: "2026-10-28",
    });
    expect(bot.api.sendMessage).toHaveBeenCalledWith(
      100,
      expect.stringContaining("Осенний старт"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: [
            [{ text: "Указать результат", callback_data: "competition:7:result" }],
            [{ text: "Пропустил", callback_data: "competition:7:skip" }],
          ],
        }),
      })
    );
    expect(mocks.markSent).toHaveBeenCalledWith({ requestId: 7, leaseToken: "lease-7" });
  });

  it("догоняет отправку позднее в тот же день и учитывает смену даты в часовом поясе", async () => {
    mocks.subscriptions.mockResolvedValue([{ ...subscription, timezone: "Pacific/Kiritimati" }]);
    const bot = { api: { sendMessage: vi.fn().mockResolvedValue({ message_id: 33 }) } };
    await dispatchCompetitionResults(bot as any, new Date("2026-10-28T22:30:00Z"));
    expect(mocks.listDue).toHaveBeenCalledWith({ userId: 10, chatId: 100, date: "2026-10-28" });
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("до назначенного времени и без времени не запрашивает соревнования", async () => {
    mocks.subscriptions.mockResolvedValue([subscription, { ...subscription, sendTime: null }]);
    const bot = { api: { sendMessage: vi.fn() } };
    await dispatchCompetitionResults(bot as any, new Date("2026-10-29T06:59:00Z"));
    expect(mocks.listDue).not.toHaveBeenCalled();
    expect(bot.api.sendMessage).not.toHaveBeenCalled();
  });

  it("не отправляет запрос, уже захваченный другим диспетчером", async () => {
    mocks.claim.mockResolvedValue(null);
    const bot = { api: { sendMessage: vi.fn() } };
    await dispatchCompetitionResults(bot as any, new Date("2026-10-29T07:00:00Z"));
    expect(bot.api.sendMessage).not.toHaveBeenCalled();
    expect(mocks.markSent).not.toHaveBeenCalled();
  });

  it("освобождает захват после ошибки Telegram и продолжает следующие старты", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.listDue.mockResolvedValue([competition, { ...competition, id: 21 }]);
    mocks.claim
      .mockResolvedValueOnce({ id: 7, leaseToken: "lease-7", competition })
      .mockResolvedValueOnce({ id: 8, leaseToken: "lease-8", competition });
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("telegram-unavailable"))
      .mockResolvedValueOnce({ message_id: 34 });
    await dispatchCompetitionResults(
      { api: { sendMessage } } as any,
      new Date("2026-10-29T07:00:00Z")
    );
    expect(mocks.release).toHaveBeenCalledWith({ requestId: 7, leaseToken: "lease-7" });
    expect(mocks.markSent).toHaveBeenCalledWith({ requestId: 8, leaseToken: "lease-8" });
    expect(sendMessage).toHaveBeenCalledTimes(2);
    errorLog.mockRestore();
  });

  it("плохой часовой пояс не блокирует следующие подписки", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.subscriptions.mockResolvedValue([
      { ...subscription, timezone: "Bad/Zone" },
      subscription,
    ]);
    const bot = { api: { sendMessage: vi.fn().mockResolvedValue({ message_id: 33 }) } };
    await dispatchCompetitionResults(bot as any, new Date("2026-10-29T07:00:00Z"));
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(1);
    errorLog.mockRestore();
  });
});
