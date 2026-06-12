import type { Bot } from "grammy";
import {
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  getNextIsoDates,
  getWeekdayShortRu,
  parseDisplayDate,
} from "@/bot/utils/dateTime";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { getPlanEntriesByDate } from "@/server/planEntries";
import { getDailyReportTextByDate } from "@/server/diary";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import {
  buildDailyReportMenuReplyKeyboard,
  buildDateMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  CUSTOM_DATE_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";
import { resetPendingInput } from "@/bot/commands/handlers/helpers";

const DATE_MENU_PROMPT_TEXT = `Выбери дату из списка или нажми "${CUSTOM_DATE_BUTTON_TEXT}".`;

const buildPlanDateButtons = (today: string) => {
  return getNextIsoDates(today, 7).map((date) => {
    const weekday = getWeekdayShortRu(date);
    const label = formatDateForDisplay(date);
    if (!weekday) {
      return label;
    }
    return `${label} (${weekday})`;
  });
};

export const registerPlanCommands = (bot: Bot) => {
  bot.command("today", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
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
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
    }

    const subscription = await getSubscription(userId);
    const timeZone = subscription?.timezone ?? null;

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const rawDate = parts[1];
    const date = rawDate ? parseDisplayDate(rawDate) : null;

    if (!date) {
      setPendingInput(ctx.chat.id, "dateMenu");
      const today = timeZone
        ? formatDateInTimeZone(new Date(), timeZone)
        : formatDateLocal(new Date());
      return ctx.reply(DATE_MENU_PROMPT_TEXT, {
        reply_markup: buildDateMenuReplyKeyboard({
          dateButtons: buildPlanDateButtons(today),
        }),
      });
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
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
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
      setPendingInput(ctx.chat.id, "dailyReportMenu");
      return ctx.reply("Выбери дату для ежедневного отчета.", {
        reply_markup: buildDailyReportMenuReplyKeyboard(),
      });
    }

    const reportText = await getDailyReportTextByDate({ userId, date });

    if (!timeZone && !rawDate) {
      return ctx.reply(`${reportText}\n\nТаймзона не задана, использую время сервера.`);
    }

    return ctx.reply(reportText);
  });
};
