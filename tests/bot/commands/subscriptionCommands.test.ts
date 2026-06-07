import { beforeEach, describe, expect, it, vi } from "vitest";

const subscriptionMocks = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
  upsertSubscriptionMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: subscriptionMocks.ensureLinkedMock,
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: subscriptionMocks.getSubscriptionMock,
  upsertSubscription: subscriptionMocks.upsertSubscriptionMock,
}));

import { registerSubscriptionCommands } from "@/bot/commands/handlers/subscriptionCommands";

type CommandHandler = (ctx: any) => Promise<unknown>;

function createBotHarness() {
  const handlers = new Map<string, CommandHandler>();
  const bot = {
    command: vi.fn((name: string, handler: CommandHandler) => {
      handlers.set(name, handler);
    }),
  };

  registerSubscriptionCommands(bot as any);

  return handlers;
}

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    chat: {
      id: 10,
      type: "private",
    },
    message: {
      text: "",
    },
    reply: vi.fn(),
    ...overrides,
  };
}

describe("registerSubscriptionCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionMocks.ensureLinkedMock.mockResolvedValue(20);
    subscriptionMocks.getSubscriptionMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "07:30",
    });
  });

  it("должен регистрировать команды подписки", () => {
    const handlers = createBotHarness();

    expect(Array.from(handlers.keys()).sort()).toEqual([
      "subscribe",
      "time",
      "timezone",
      "unsubscribe",
    ]);
  });

  it("должен игнорировать команды подписки без чата", async () => {
    const handlers = createBotHarness();
    const ctx = createContext({ chat: undefined });

    await (handlers.get("subscribe") as CommandHandler)(ctx);
    await (handlers.get("unsubscribe") as CommandHandler)(ctx);
    await (handlers.get("time") as CommandHandler)(ctx);
    await (handlers.get("timezone") as CommandHandler)(ctx);

    expect(subscriptionMocks.ensureLinkedMock).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("должен требовать связанный аккаунт", async () => {
    const handlers = createBotHarness();
    const subscribeCtx = createContext();
    const unsubscribeCtx = createContext();
    const timeCtx = createContext({ message: { text: "/time 08:00" } });
    const timezoneCtx = createContext({ message: { text: "/timezone Europe/Moscow" } });

    subscriptionMocks.ensureLinkedMock.mockResolvedValue(null);

    await (handlers.get("subscribe") as CommandHandler)(subscribeCtx);
    await (handlers.get("unsubscribe") as CommandHandler)(unsubscribeCtx);
    await (handlers.get("time") as CommandHandler)(timeCtx);
    await (handlers.get("timezone") as CommandHandler)(timezoneCtx);

    expect(subscribeCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт командой /link.");
    expect(unsubscribeCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт командой /link.");
    expect(timeCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт командой /link.");
    expect(timezoneCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт командой /link.");
  });

  it("должен включать и выключать подписку", async () => {
    const handlers = createBotHarness();
    const subscribeNeedsSettingsCtx = createContext();
    const subscribeReadyCtx = createContext();
    const unsubscribeCtx = createContext();

    subscriptionMocks.getSubscriptionMock
      .mockResolvedValueOnce({ enabled: true, timezone: null, sendTime: null })
      .mockResolvedValueOnce({ enabled: true, timezone: "Europe/Moscow", sendTime: "07:30" })
      .mockResolvedValueOnce({ enabled: false, timezone: "Europe/Moscow", sendTime: "07:30" });

    await (handlers.get("subscribe") as CommandHandler)(subscribeNeedsSettingsCtx);
    await (handlers.get("subscribe") as CommandHandler)(subscribeReadyCtx);
    await (handlers.get("unsubscribe") as CommandHandler)(unsubscribeCtx);

    expect(subscriptionMocks.upsertSubscriptionMock).toHaveBeenNthCalledWith(1, {
      userId: 20,
      chatId: 10,
      patch: { enabled: true },
    });
    expect(subscribeNeedsSettingsCtx.reply).toHaveBeenCalledWith(
      "Подписка включена, но нужно задать /timezone и /time, чтобы получать рассылку.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(subscribeReadyCtx.reply).toHaveBeenCalledWith(
      "Подписка включена.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(subscriptionMocks.upsertSubscriptionMock).toHaveBeenNthCalledWith(3, {
      userId: 20,
      chatId: 10,
      patch: { enabled: false },
    });
    expect(unsubscribeCtx.reply).toHaveBeenCalledWith(
      "Подписка выключена.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен валидировать и сохранять время рассылки", async () => {
    const handlers = createBotHarness();
    const missingCtx = createContext({ message: { text: "/time" } });
    const invalidCtx = createContext({ message: { text: "/time 25:90" } });
    const validCtx = createContext({ message: { text: "/time 08:15" } });

    await (handlers.get("time") as CommandHandler)(missingCtx);
    await (handlers.get("time") as CommandHandler)(invalidCtx);
    await (handlers.get("time") as CommandHandler)(validCtx);

    expect(missingCtx.reply).toHaveBeenCalledWith("Используй: /time 07:30");
    expect(invalidCtx.reply).toHaveBeenCalledWith("Используй: /time 07:30");
    expect(subscriptionMocks.upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: 20,
      chatId: 10,
      patch: { sendTime: "08:15" },
    });
    expect(validCtx.reply).toHaveBeenCalledWith("Время рассылки обновлено: 08:15.");
  });

  it("должен показывать, валидировать и сохранять таймзону", async () => {
    const handlers = createBotHarness();
    const currentCtx = createContext({ message: { text: "/timezone" } });
    const invalidCtx = createContext({ message: { text: "/timezone Bad/Zone" } });
    const offsetCtx = createContext({ message: { text: "/timezone +3" } });
    const ianaCtx = createContext({ message: { text: "/timezone Europe/Moscow" } });

    subscriptionMocks.getSubscriptionMock.mockResolvedValueOnce({
      enabled: true,
      timezone: null,
      sendTime: "07:30",
    });

    await (handlers.get("timezone") as CommandHandler)(currentCtx);
    await (handlers.get("timezone") as CommandHandler)(invalidCtx);
    await (handlers.get("timezone") as CommandHandler)(offsetCtx);
    await (handlers.get("timezone") as CommandHandler)(ianaCtx);

    expect(currentCtx.reply).toHaveBeenCalledWith(
      "Текущая таймзона: не задана. Используй: /timezone Europe/Moscow или /timezone +3"
    );
    expect(invalidCtx.reply).toHaveBeenCalledWith(
      "Неверная таймзона. Используй формат IANA или смещение (+3)."
    );
    expect(subscriptionMocks.upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: 20,
      chatId: 10,
      patch: { timezone: "Etc/GMT-3" },
    });
    expect(offsetCtx.reply).toHaveBeenCalledWith("Таймзона обновлена: Etc/GMT-3 (смещение +3).");
    expect(ianaCtx.reply).toHaveBeenCalledWith("Таймзона обновлена: Europe/Moscow.");
  });
});
