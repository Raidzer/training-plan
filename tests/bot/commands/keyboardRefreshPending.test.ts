import { beforeEach, describe, expect, it, vi } from "vitest";

const pendingMocks = vi.hoisted(() => ({
  clearPendingInputMock: vi.fn(),
  getLinkedAccountDetailsMock: vi.fn(),
  refreshTelegramKeyboardsMock: vi.fn(),
}));

vi.mock("@/bot/menu/menuState", () => ({
  clearPendingInput: pendingMocks.clearPendingInputMock,
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  getLinkedAccountDetails: pendingMocks.getLinkedAccountDetailsMock,
}));

vi.mock("@/bot/services/telegramKeyboardRefresh", () => ({
  refreshTelegramKeyboards: pendingMocks.refreshTelegramKeyboardsMock,
}));

import { handleKeyboardRefreshPending } from "@/bot/commands/handlers/textMessage/pending/handleKeyboardRefresh";
import { buildCancelReplyKeyboard, buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

function createContext() {
  return { reply: vi.fn() };
}

describe("handleKeyboardRefreshPending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingMocks.getLinkedAccountDetailsMock.mockResolvedValue({
      userId: 20,
      role: "admin",
      subscribed: true,
    });
    pendingMocks.refreshTelegramKeyboardsMock.mockResolvedValue({
      total: 3,
      sent: 2,
      failed: 1,
    });
  });

  it("должен требовать непустое сообщение", async () => {
    const ctx = createContext();

    await handleKeyboardRefreshPending({
      bot: {} as any,
      ctx,
      chatId: 10,
      text: "   ",
    });

    expect(ctx.reply).toHaveBeenCalledWith("Введите сообщение пользователям.", {
      reply_markup: buildCancelReplyKeyboard(),
    });
    expect(pendingMocks.refreshTelegramKeyboardsMock).not.toHaveBeenCalled();
  });

  it("должен рассылать сообщение администратором и возвращать главное меню", async () => {
    const ctx = createContext();
    const bot = {} as any;

    await handleKeyboardRefreshPending({
      bot,
      ctx,
      chatId: 10,
      text: "  Вышло обновление  ",
    });

    expect(pendingMocks.refreshTelegramKeyboardsMock).toHaveBeenCalledWith(bot, "Вышло обновление");
    expect(pendingMocks.clearPendingInputMock).toHaveBeenCalledWith(10);
    expect(ctx.reply).toHaveBeenCalledWith(
      "Обновление клавиатур завершено. Отправлено: 2/3. Ошибок: 1.",
      { reply_markup: buildMainMenuReplyKeyboard({ subscribed: true }) }
    );
  });

  it("должен отклонять сообщение длиннее лимита Telegram", async () => {
    const ctx = createContext();

    await handleKeyboardRefreshPending({
      bot: {} as any,
      ctx,
      chatId: 10,
      text: "a".repeat(4097),
    });

    expect(ctx.reply).toHaveBeenCalledWith("Сообщение не должно превышать 4096 символов.", {
      reply_markup: buildCancelReplyKeyboard(),
    });
    expect(pendingMocks.refreshTelegramKeyboardsMock).not.toHaveBeenCalled();
  });

  it("должен запретить рассылку пользователю без роли администратора", async () => {
    const ctx = createContext();
    pendingMocks.getLinkedAccountDetailsMock.mockResolvedValueOnce({
      userId: 20,
      role: "coach",
      subscribed: false,
    });

    await handleKeyboardRefreshPending({
      bot: {} as any,
      ctx,
      chatId: 10,
      text: "Вышло обновление",
    });

    expect(pendingMocks.clearPendingInputMock).toHaveBeenCalledWith(10);
    expect(ctx.reply).toHaveBeenCalledWith("Команда доступна только администратору.");
    expect(pendingMocks.refreshTelegramKeyboardsMock).not.toHaveBeenCalled();
  });
});
