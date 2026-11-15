import type { Bot } from "grammy";
import { buildMainMenuReplyKeyboard, buildCancelReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { clearPendingInput } from "@/bot/menu/menuState";
import { getLinkedAccountDetails } from "@/bot/services/telegramAccounts";
import { refreshTelegramKeyboards } from "@/bot/services/telegramKeyboardRefresh";
import { ROLES } from "@/shared/constants";

const TELEGRAM_MESSAGE_LIMIT = 4096;

type KeyboardRefreshHandlerArgs = {
  bot: Bot;
  ctx: any;
  chatId: number;
  text: string;
};

export const handleKeyboardRefreshPending = async ({
  bot,
  ctx,
  chatId,
  text,
}: KeyboardRefreshHandlerArgs) => {
  const message = text.trim();
  if (!message) {
    await ctx.reply("Введите сообщение пользователям.", {
      reply_markup: buildCancelReplyKeyboard(),
    });
    return;
  }

  if (message.length > TELEGRAM_MESSAGE_LIMIT) {
    await ctx.reply("Сообщение не должно превышать 4096 символов.", {
      reply_markup: buildCancelReplyKeyboard(),
    });
    return;
  }

  const account = await getLinkedAccountDetails(chatId);
  if (!account || account.role !== ROLES.ADMIN) {
    clearPendingInput(chatId);
    await ctx.reply("Команда доступна только администратору.");
    return;
  }

  const result = await refreshTelegramKeyboards(bot, message);
  clearPendingInput(chatId);
  await ctx.reply(
    `Обновление клавиатур завершено. Отправлено: ${result.sent}/${result.total}. Ошибок: ${result.failed}.`,
    {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: account.subscribed,
      }),
    }
  );
};
