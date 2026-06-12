import { formatDateInTimeZone, formatDateLocal, parseDisplayDate } from "@/bot/utils/dateTime";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildBackReplyKeyboard,
  buildDailyReportMenuReplyKeyboard,
  buildMainMenuReplyKeyboard,
  DAILY_REPORT_CUSTOM_DATE_BUTTON_TEXT,
  DATE_BACK_BUTTON_TEXT,
  isButtonText,
  TODAY_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, setPendingInput } from "@/bot/menu/menuState";
import { getDailyReportTextByDate } from "@/server/diary";

type DailyReportHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending: "dailyReportMenu" | "dailyReportDate";
  userId: number;
};

const DATE_PROMPT_TEXT = "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025).";
const DAILY_REPORT_MENU_PROMPT_TEXT = `Нажми "${TODAY_BUTTON_TEXT}", "${DAILY_REPORT_CUSTOM_DATE_BUTTON_TEXT}" или "${DATE_BACK_BUTTON_TEXT}".`;

const replyWithDailyReport = async (params: {
  ctx: any;
  userId: number;
  date: string;
  subscribed: boolean;
  timeZone: string | null;
  showServerTimeHint: boolean;
}) => {
  const reportText = await getDailyReportTextByDate({
    userId: params.userId,
    date: params.date,
  });
  const message =
    !params.timeZone && params.showServerTimeHint
      ? `${reportText}\n\nТаймзона не задана, использую время сервера.`
      : reportText;

  await params.ctx.reply(message, {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: params.subscribed,
    }),
  });
};

export const handleDailyReportPending = async ({
  ctx,
  chatId,
  text,
  pending,
  userId,
}: DailyReportHandlerArgs) => {
  const subscription = await getSubscription(userId);
  const timeZone = subscription?.timezone ?? null;
  const subscribed = subscription?.enabled ?? false;

  if (pending === "dailyReportMenu") {
    if (isButtonText(text, DATE_BACK_BUTTON_TEXT)) {
      clearPendingInput(chatId);
      await ctx.reply("Меню управления ниже.", {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed,
        }),
      });
      return;
    }

    if (isButtonText(text, TODAY_BUTTON_TEXT)) {
      const today = timeZone
        ? formatDateInTimeZone(new Date(), timeZone)
        : formatDateLocal(new Date());
      clearPendingInput(chatId);
      await replyWithDailyReport({
        ctx,
        userId,
        date: today,
        subscribed,
        timeZone,
        showServerTimeHint: true,
      });
      return;
    }

    if (isButtonText(text, DAILY_REPORT_CUSTOM_DATE_BUTTON_TEXT)) {
      setPendingInput(chatId, "dailyReportDate");
      await ctx.reply(DATE_PROMPT_TEXT, {
        reply_markup: buildBackReplyKeyboard(),
      });
      return;
    }

    await ctx.reply(DAILY_REPORT_MENU_PROMPT_TEXT, {
      reply_markup: buildDailyReportMenuReplyKeyboard(),
    });
    return;
  }

  if (isButtonText(text, DATE_BACK_BUTTON_TEXT)) {
    setPendingInput(chatId, "dailyReportMenu");
    await ctx.reply("Выбери дату для ежедневного отчета.", {
      reply_markup: buildDailyReportMenuReplyKeyboard(),
    });
    return;
  }

  const parsedDate = parseDisplayDate(text);
  if (!parsedDate) {
    await ctx.reply(DATE_PROMPT_TEXT, {
      reply_markup: buildBackReplyKeyboard(),
    });
    return;
  }

  clearPendingInput(chatId);
  await replyWithDailyReport({
    ctx,
    userId,
    date: parsedDate,
    subscribed,
    timeZone,
    showServerTimeHint: false,
  });
};
