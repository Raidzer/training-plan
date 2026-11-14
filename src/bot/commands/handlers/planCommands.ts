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
import { sendLongPlanText, sendPlanFromContext } from "@/bot/messages/planWidget";
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
    const timezoneWarning = "Таймзона не задана, использую время сервера.";
    const result = await sendPlanFromContext({
      ctx,
      chatId: ctx.chat.id,
      date: today,
      entries,
      sendText: (text) => ctx.reply(timeZone ? text : `${text}\n\n${timezoneWarning}`),
    });

    if (!timeZone && result.type === "widget") {
      return ctx.reply(timezoneWarning);
    }

    return;
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
    await sendPlanFromContext({
      ctx,
      chatId: ctx.chat.id,
      date,
      entries,
    });
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

  bot.callbackQuery(/^plan:text:(\d{4}-\d{2}-\d{2})$/, async (ctx: any) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat || ctx.chat.type !== "private") {
      return;
    }

    const date = ctx.match?.[1] as string | undefined;
    if (
      !date ||
      parseDisplayDate(`${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}`) !== date
    ) {
      return;
    }

    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      await ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
      return;
    }

    const entries = await getPlanEntriesByDate({ userId, date });
    const message = formatPlanMessage({ date, entries });
    await sendLongPlanText((text) => ctx.reply(text), message);
  });
};
