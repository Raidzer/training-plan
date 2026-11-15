import type { Bot } from "grammy";
import { buildCancelReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";
import { getLinkedAccountDetails } from "@/bot/services/telegramAccounts";
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

    setPendingInput(ctx.chat.id, "keyboardRefreshMessage");
    await ctx.reply("Введите сообщение пользователям для обновления.", {
      reply_markup: buildCancelReplyKeyboard(),
    });
  });
};
