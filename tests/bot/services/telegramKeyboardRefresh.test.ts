import { beforeEach, describe, expect, it, vi } from "vitest";

const keyboardRefreshMocks = vi.hoisted(() => ({
  getKeyboardRefreshTargetsMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  getKeyboardRefreshTargets: keyboardRefreshMocks.getKeyboardRefreshTargetsMock,
}));

import {
  KEYBOARD_REFRESH_MESSAGE,
  refreshTelegramKeyboards,
} from "@/bot/services/telegramKeyboardRefresh";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

function createBot() {
  return {
    api: {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("refreshTelegramKeyboards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    keyboardRefreshMocks.getKeyboardRefreshTargetsMock.mockResolvedValue([]);
  });

  it("должен отправлять актуальную клавиатуру всем связанным чатам", async () => {
    const bot = createBot();
    keyboardRefreshMocks.getKeyboardRefreshTargetsMock.mockResolvedValue([
      { userId: 20, chatId: 100, subscribed: true },
      { userId: 30, chatId: 200, subscribed: false },
    ]);

    await expect(refreshTelegramKeyboards(bot as any)).resolves.toEqual({
      total: 2,
      sent: 2,
      failed: 0,
    });

    expect(bot.api.sendMessage).toHaveBeenNthCalledWith(1, 100, KEYBOARD_REFRESH_MESSAGE, {
      reply_markup: buildMainMenuReplyKeyboard({ subscribed: true }),
    });
    expect(bot.api.sendMessage).toHaveBeenNthCalledWith(2, 200, KEYBOARD_REFRESH_MESSAGE, {
      reply_markup: buildMainMenuReplyKeyboard({ subscribed: false }),
    });
  });

  it("должен продолжать рассылку после ошибки отправки", async () => {
    const bot = createBot();
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});

    bot.api.sendMessage
      .mockRejectedValueOnce(new Error("send-failed"))
      .mockResolvedValueOnce(undefined);
    keyboardRefreshMocks.getKeyboardRefreshTargetsMock.mockResolvedValue([
      { userId: 20, chatId: 100, subscribed: true },
      { userId: 30, chatId: 200, subscribed: false },
    ]);

    await expect(refreshTelegramKeyboards(bot as any)).resolves.toEqual({
      total: 2,
      sent: 1,
      failed: 1,
    });

    expect(bot.api.sendMessage).toHaveBeenCalledTimes(2);
    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Ошибка обновления Telegram-клавиатуры",
      100,
      expect.any(Error)
    );

    consoleErrorMock.mockRestore();
  });
});
