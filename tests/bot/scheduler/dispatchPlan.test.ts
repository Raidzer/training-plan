import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dispatchMocks = vi.hoisted(() => ({
  getEnabledSubscriptionsMock: vi.fn(),
  markSubscriptionSentMock: vi.fn(),
  getPlanEntriesByDateMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getEnabledSubscriptions: dispatchMocks.getEnabledSubscriptionsMock,
  markSubscriptionSent: dispatchMocks.markSubscriptionSentMock,
}));

vi.mock("@/server/planEntries", () => ({
  getPlanEntriesByDate: dispatchMocks.getPlanEntriesByDateMock,
}));

import { startDispatchScheduler } from "@/bot/scheduler/dispatchPlan";

function createBot() {
  return {
    api: {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("startDispatchScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T07:30:00.000Z"));
    dispatchMocks.getEnabledSubscriptionsMock.mockResolvedValue([]);
    dispatchMocks.getPlanEntriesByDateMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("должен запускать проверку сразу и планировать интервал", async () => {
    const bot = createBot();
    const interval = startDispatchScheduler(bot as any);

    await vi.waitFor(() => {
      expect(dispatchMocks.getEnabledSubscriptionsMock).toHaveBeenCalled();
    });

    clearInterval(interval);
  });

  it("должен отправлять план только подходящим подпискам", async () => {
    const bot = createBot();
    dispatchMocks.getEnabledSubscriptionsMock.mockResolvedValue([
      {
        id: 1,
        userId: 10,
        chatId: 100,
        timezone: null,
        sendTime: "07:30",
        lastSentOn: null,
      },
      {
        id: 2,
        userId: 20,
        chatId: 200,
        timezone: "Etc/UTC",
        sendTime: "08:00",
        lastSentOn: null,
      },
      {
        id: 3,
        userId: 30,
        chatId: 300,
        timezone: "Etc/UTC",
        sendTime: "07:30",
        lastSentOn: "2026-05-11",
      },
      {
        id: 4,
        userId: 40,
        chatId: 400,
        timezone: "Etc/UTC",
        sendTime: "07:30",
        lastSentOn: null,
      },
    ]);

    const interval = startDispatchScheduler(bot as any);

    await vi.waitFor(() => {
      expect(dispatchMocks.markSubscriptionSentMock).toHaveBeenCalledWith({
        id: 4,
        sentOn: "2026-05-11",
      });
    });

    expect(dispatchMocks.getPlanEntriesByDateMock).toHaveBeenCalledWith({
      userId: 40,
      date: "2026-05-11",
    });
    expect(bot.api.sendMessage).toHaveBeenCalledWith(
      400,
      ["На 11-05-2026 нет тренировок.", "", "Время рассылки: 07:30."].join("\n")
    );
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(1);

    clearInterval(interval);
  });

  it("должен пропускать некорректную таймзону и ошибку отправки", async () => {
    const bot = createBot();
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});

    bot.api.sendMessage.mockRejectedValueOnce(new Error("send-failed"));
    dispatchMocks.getEnabledSubscriptionsMock.mockResolvedValue([
      {
        id: 1,
        userId: 10,
        chatId: 100,
        timezone: "Bad/Zone",
        sendTime: "07:30",
        lastSentOn: null,
      },
      {
        id: 2,
        userId: 20,
        chatId: 200,
        timezone: "Etc/UTC",
        sendTime: "07:30",
        lastSentOn: null,
      },
    ]);

    const interval = startDispatchScheduler(bot as any);

    await vi.waitFor(() => {
      expect(bot.api.sendMessage).toHaveBeenCalledTimes(1);
    });

    expect(dispatchMocks.markSubscriptionSentMock).not.toHaveBeenCalled();
    expect(consoleErrorMock).toHaveBeenCalledTimes(2);

    consoleErrorMock.mockRestore();
    clearInterval(interval);
  });
});
