import type { Bot } from "grammy";
import { formatDateInTimeZone, formatDateLocal, parseDisplayDate } from "@/bot/utils/dateTime";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { getPlanEntriesByDate } from "@/server/planEntries";
import { getDailyReportTextByDate } from "@/server/diary";
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
      return ctx.reply(`${message}\n\nТаймзона не задана, использую время сервера.`);
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
    const rawDate = parts[1];
    const date = rawDate ? parseDisplayDate(rawDate) : null;

    if (!date) {
      return ctx.reply("Используй: /date 21-12-2025");
    }

    const entries = await getPlanEntriesByDate({ userId, date });
    const message = formatPlanMessage({ date, entries });

    return ctx.reply(message);
  });

  bot.command("report", async (ctx: any) => {
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
    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const rawDate = parts[1];
    const date = rawDate
      ? parseDisplayDate(rawDate)
      : timeZone
        ? formatDateInTimeZone(new Date(), timeZone)
        : formatDateLocal(new Date());

    if (!date) {
      return ctx.reply("Используй: /report 21-12-2025");
    }

    const reportText = await getDailyReportTextByDate({ userId, date });

    if (!timeZone && !rawDate) {
      return ctx.reply(`${reportText}\n\nТаймзона не задана, использую время сервера.`);
    }

    return ctx.reply(reportText);
  });
};
