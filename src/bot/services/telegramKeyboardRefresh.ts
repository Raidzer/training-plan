import type { Bot } from "grammy";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { getKeyboardRefreshTargets } from "@/bot/services/telegramAccounts";

export const KEYBOARD_REFRESH_MESSAGE = "Меню обновлено.";

export type KeyboardRefreshResult = {
  total: number;
  sent: number;
  failed: number;
};

export const refreshTelegramKeyboards = async (bot: Bot): Promise<KeyboardRefreshResult> => {
  const targets = await getKeyboardRefreshTargets();
  const result: KeyboardRefreshResult = {
    total: targets.length,
    sent: 0,
    failed: 0,
  };

  for (const target of targets) {
    try {
      await bot.api.sendMessage(target.chatId, KEYBOARD_REFRESH_MESSAGE, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: target.subscribed,
        }),
      });
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      console.error("Ошибка обновления Telegram-клавиатуры", target.chatId, error);
    }
  }

  return result;
};
