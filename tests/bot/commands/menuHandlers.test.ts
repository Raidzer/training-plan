import { beforeEach, describe, expect, it, vi } from "vitest";

const menuHandlerMocks = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
  upsertSubscriptionMock: vi.fn(),
  getPlanEntriesByDateMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: menuHandlerMocks.ensureLinkedMock,
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: menuHandlerMocks.getSubscriptionMock,
  upsertSubscription: menuHandlerMocks.upsertSubscriptionMock,
}));

vi.mock("@/server/planEntries", () => ({
  getPlanEntriesByDate: menuHandlerMocks.getPlanEntriesByDateMock,
}));

import { handleCancelIfRequested } from "@/bot/commands/handlers/textMessage/pending/handleCancel";
import { handlePlanMenuAction } from "@/bot/commands/handlers/textMessage/menu/handlePlanAction";
import { handleScheduleMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleScheduleAction";
import { handleSubscriptionMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleSubscriptionAction";
import {
  CANCEL_LINK_BUTTON_TEXT,
  CUSTOM_DATE_BUTTON_TEXT,
  LINK_BUTTON_TEXT,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  buildTimeReplyKeyboard,
  buildTimezoneReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, getPendingInput, setPendingInput } from "@/bot/menu/menuState";

const DATE_MENU_PROMPT_TEXT = `Выбери дату из списка или нажми "${CUSTOM_DATE_BUTTON_TEXT}".`;

function createContext() {
  return {
    reply: vi.fn(),
  };
}

describe("bot menu handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    clearPendingInput(10);
    menuHandlerMocks.ensureLinkedMock.mockResolvedValue(20);
    menuHandlerMocks.getSubscriptionMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "07:30",
    });
    menuHandlerMocks.getPlanEntriesByDateMock.mockResolvedValue([]);
  });

  it("handleCancelIfRequested игнорирует обычный текст", async () => {
    const ctx = createContext();

    const result = await handleCancelIfRequested({
      ctx,
      chatId: 10,
      text: "продолжить",
      pending: "date",
    });

    expect(result).toBe(false);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("handleCancelIfRequested отменяет ввод для несвязанного пользователя", async () => {
    const ctx = createContext();
    setPendingInput(10, "link");
    menuHandlerMocks.ensureLinkedMock.mockResolvedValue(null);

    const result = await handleCancelIfRequested({
      ctx,
      chatId: 10,
      text: CANCEL_LINK_BUTTON_TEXT,
      pending: "link",
    });

    expect(result).toBe(true);
    expect(getPendingInput(10)).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith("Ввод отменен.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    expect(menuHandlerMocks.getSubscriptionMock).not.toHaveBeenCalled();
  });

  it("handleCancelIfRequested возвращает главное меню для связанного пользователя", async () => {
    const ctx = createContext();

    const result = await handleCancelIfRequested({
      ctx,
      chatId: 10,
      text: "/cancel",
      pending: "date",
    });

    expect(result).toBe(true);
    expect(menuHandlerMocks.getSubscriptionMock).toHaveBeenCalledWith(20);
    expect(ctx.reply).toHaveBeenCalledWith("Ввод отменен.", {
      reply_markup: buildMainMenuReplyKeyboard({ subscribed: true }),
    });
  });

  it("handlePlanMenuAction показывает план на сегодня с таймзоной", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T21:10:00.000Z"));

    const ctx = createContext();
    menuHandlerMocks.getPlanEntriesByDateMock.mockResolvedValueOnce([
      {
        id: 1,
        date: "2026-06-02",
        sessionOrder: 1,
        taskText: "Кросс",
        commentText: "легко",
        isWorkload: true,
      },
    ]);

    await handlePlanMenuAction({
      ctx,
      chatId: 10,
      userId: 20,
      action: "today",
    });

    expect(menuHandlerMocks.getPlanEntriesByDateMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2026-06-02",
    });
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("План на 02-06-2026:"),
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(ctx.reply.mock.calls[0][0]).toContain("Кросс");
    expect(ctx.reply.mock.calls[0][0]).toContain("легко");

    vi.useRealTimers();
  });

  it("handlePlanMenuAction использует время сервера без таймзоны", async () => {
    const ctx = createContext();
    menuHandlerMocks.getSubscriptionMock.mockResolvedValueOnce(null);

    await handlePlanMenuAction({
      ctx,
      chatId: 10,
      userId: 20,
      action: "today",
    });

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Таймзона не задана, использую время сервера."),
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("handlePlanMenuAction открывает выбор даты", async () => {
    const ctx = createContext();

    await handlePlanMenuAction({
      ctx,
      chatId: 10,
      userId: 20,
      action: "date",
    });

    expect(getPendingInput(10)).toBe("dateMenu");
    expect(ctx.reply).toHaveBeenCalledWith(
      DATE_MENU_PROMPT_TEXT,
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("handleScheduleMenuAction запрашивает время и таймзону", async () => {
    const ctx = createContext();

    await handleScheduleMenuAction({
      ctx,
      chatId: 10,
      action: "time",
      userId: 20,
    });
    await handleScheduleMenuAction({
      ctx,
      chatId: 10,
      action: "timezone",
      userId: 20,
    });

    expect(ctx.reply).toHaveBeenNthCalledWith(
      1,
      "Выберите время кнопкой или напишите новое в формате HH:MM.",
      {
        reply_markup: buildTimeReplyKeyboard(),
      }
    );
    expect(ctx.reply).toHaveBeenNthCalledWith(
      2,
      "Текущая таймзона: Europe/Moscow. Выберите таймзону кнопкой или напишите новую IANA/смещение, например Europe/Moscow или +3.",
      {
        reply_markup: buildTimezoneReplyKeyboard({
          currentTimeZone: "Europe/Moscow",
        }),
      }
    );
  });

  it("handleSubscriptionMenuAction обрабатывает состояния подписки", async () => {
    const needsSettingsCtx = createContext();
    const readyCtx = createContext();
    const unsubscribeCtx = createContext();

    menuHandlerMocks.getSubscriptionMock
      .mockResolvedValueOnce({ enabled: true, timezone: null, sendTime: null })
      .mockResolvedValueOnce({ enabled: true, timezone: "Europe/Moscow", sendTime: "07:30" })
      .mockResolvedValueOnce({ enabled: false, timezone: "Europe/Moscow", sendTime: "07:30" });

    await handleSubscriptionMenuAction({
      ctx: needsSettingsCtx,
      chatId: 10,
      userId: 20,
      action: "subscribe",
    });
    await handleSubscriptionMenuAction({
      ctx: readyCtx,
      chatId: 10,
      userId: 20,
      action: "subscribe",
    });
    await handleSubscriptionMenuAction({
      ctx: unsubscribeCtx,
      chatId: 10,
      userId: 20,
      action: "unsubscribe",
    });

    expect(menuHandlerMocks.upsertSubscriptionMock).toHaveBeenNthCalledWith(1, {
      userId: 20,
      chatId: 10,
      patch: { enabled: true },
    });
    expect(needsSettingsCtx.reply).toHaveBeenCalledWith(
      "Подписка включена, но нужно задать часовой пояс и время рассылки в меню ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(readyCtx.reply).toHaveBeenCalledWith(
      "Подписка включена.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(menuHandlerMocks.upsertSubscriptionMock).toHaveBeenNthCalledWith(3, {
      userId: 20,
      chatId: 10,
      patch: { enabled: false },
    });
    expect(unsubscribeCtx.reply).toHaveBeenCalledWith(
      "Подписка выключена.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("handleSubscriptionMenuAction корректно строит меню при пустой подписке", async () => {
    const ctx = createContext();
    menuHandlerMocks.getSubscriptionMock.mockResolvedValueOnce(null);

    await handleSubscriptionMenuAction({
      ctx,
      chatId: 10,
      userId: 20,
      action: "subscribe",
    });

    expect(ctx.reply).toHaveBeenCalledWith(
      "Подписка включена, но нужно задать часовой пояс и время рассылки в меню ниже.",
      expect.objectContaining({ reply_markup: buildMainMenuReplyKeyboard({ subscribed: false }) })
    );
  });

  it("не конфликтует с текстом кнопки привязки", () => {
    expect(LINK_BUTTON_TEXT.length).toBeGreaterThan(0);
  });
});
