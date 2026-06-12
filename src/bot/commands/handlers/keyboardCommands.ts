import type { Bot } from "grammy";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { getLinkedAccountDetails } from "@/bot/services/telegramAccounts";
import { refreshTelegramKeyboards } from "@/bot/services/telegramKeyboardRefresh";
import { ROLES } from "@/shared/constants";

export const registerKeyboardCommands = (bot: Bot) => {
  bot.command("refresh_keyboards", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }

    if (ctx.chat.type !== "private") {
      await ctx.reply("Команда доступна только в личных сообщениях.");
      return;
    }

    const account = await getLinkedAccountDetails(ctx.chat.id);
    if (!account || account.role !== ROLES.ADMIN) {
      await ctx.reply("Команда доступна только администратору.");
      return;
    }

    const result = await refreshTelegramKeyboards(bot);
    await ctx.reply(
      `Обновление клавиатур завершено. Отправлено: ${result.sent}/${result.total}. Ошибок: ${result.failed}.`,
      {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: account.subscribed,
        }),
      }
    );
  });
};
