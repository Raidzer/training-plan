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
import {
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  buildTimeReplyKeyboard,
  buildTimezoneReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, getPendingInput } from "@/bot/menu/menuState";

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
    clearPendingInput(10);
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

    expect(subscribeCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    expect(unsubscribeCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    expect(timeCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    expect(timezoneCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
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
      "Подписка включена, но нужно задать часовой пояс и время рассылки в меню ниже.",
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

    expect(missingCtx.reply).toHaveBeenCalledWith(
      "Выберите время кнопкой или напишите новое в формате HH:MM.",
      {
        reply_markup: buildTimeReplyKeyboard(),
      }
    );
    expect(invalidCtx.reply).toHaveBeenCalledWith(
      "Выберите время кнопкой или напишите новое в формате HH:MM.",
      {
        reply_markup: buildTimeReplyKeyboard(),
      }
    );
    expect(subscriptionMocks.upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: 20,
      chatId: 10,
      patch: { sendTime: "08:15" },
    });
    expect(validCtx.reply).toHaveBeenCalledWith("Время рассылки обновлено: 08:15.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });
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

    expect(currentCtx.reply).toHaveBeenCalledWith(
      "Текущая таймзона: не задана. Выберите таймзону кнопкой или напишите новую IANA/смещение, например Europe/Moscow или +3.",
      {
        reply_markup: buildTimezoneReplyKeyboard({
          currentTimeZone: null,
        }),
      }
    );
    expect(getPendingInput(10)).toBe("timezone");

    await (handlers.get("timezone") as CommandHandler)(invalidCtx);

    expect(invalidCtx.reply).toHaveBeenCalledWith(
      "Неверная таймзона. Выберите вариант кнопкой или напишите IANA/смещение.",
      {
        reply_markup: buildTimezoneReplyKeyboard({
          currentTimeZone: "Europe/Moscow",
        }),
      }
    );
    expect(getPendingInput(10)).toBe("timezone");

    await (handlers.get("timezone") as CommandHandler)(offsetCtx);
    await (handlers.get("timezone") as CommandHandler)(ianaCtx);

    expect(subscriptionMocks.upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: 20,
      chatId: 10,
      patch: { timezone: "Etc/GMT-3" },
    });
    expect(offsetCtx.reply).toHaveBeenCalledWith("Таймзона обновлена: Etc/GMT-3 (смещение +3).", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });
    expect(ianaCtx.reply).toHaveBeenCalledWith("Таймзона обновлена: Europe/Moscow.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });
  });
});
