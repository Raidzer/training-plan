import type { Bot } from "grammy";
import { DATE_REGEX } from "@/bot/utils/validators";
import {
  formatDateInTimeZone,
  formatDateLocal,
} from "@/bot/utils/dateTime";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { getPlanEntriesByDate } from "@/lib/planEntries";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import { resetPendingInput } from "@/bot/commands/handlers/helpers";

export const registerPlanCommands = (bot: Bot) => {
  bot.command("today", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const subscription = await getSubscription(userId);
    const timeZone = subscription?.timezone ?? null;
    const today = timeZone
      ? formatDateInTimeZone(new Date(), timeZone)
      : formatDateLocal(new Date());

    const entries = await getPlanEntriesByDate({ userId, date: today });
    const message = formatPlanMessage({ date: today, entries });

    if (!timeZone) {
      return ctx.reply(
        `${message}\n\nТаймзона не задана, использую время сервера.`
      );
    }

    return ctx.reply(message);
  });

  bot.command("date", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const date = parts[1];

    if (!date || !DATE_REGEX.test(date)) {
      return ctx.reply("Используй: /date 2025-12-21");
    }

    const entries = await getPlanEntriesByDate({ userId, date });
    const message = formatPlanMessage({ date, entries });

    return ctx.reply(message);
  });
};
