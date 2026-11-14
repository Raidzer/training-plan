import {
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  getNextIsoDates,
  getWeekdayShortRu,
} from "@/bot/utils/dateTime";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { sendPlanFromContext } from "@/bot/messages/planWidget";
import {
  buildDailyReportMenuReplyKeyboard,
  buildDateMenuReplyKeyboard,
  buildMainMenuReplyKeyboard,
  CUSTOM_DATE_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";
import { getPlanEntriesByDate } from "@/server/planEntries";

const DATE_MENU_PROMPT_TEXT = `Выбери дату из списка или нажми "${CUSTOM_DATE_BUTTON_TEXT}".`;

type PlanMenuActionArgs = {
  ctx: any;
  chatId: number;
  userId: number;
  action: "today" | "date" | "dailyReport";
};

export const handlePlanMenuAction = async ({ ctx, chatId, userId, action }: PlanMenuActionArgs) => {
  const subscription = await getSubscription(userId);
  const timeZone = subscription?.timezone ?? null;

  if (action === "today") {
    const today = timeZone
      ? formatDateInTimeZone(new Date(), timeZone)
      : formatDateLocal(new Date());

    const entries = await getPlanEntriesByDate({ userId, date: today });
    const mainMenu = buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    });
    const timezoneWarning = "Таймзона не задана, использую время сервера.";
    const result = await sendPlanFromContext({
      ctx,
      chatId,
      date: today,
      entries,
      sendText: (text) =>
        ctx.reply(timeZone ? text : `${text}\n\n${timezoneWarning}`, {
          reply_markup: mainMenu,
        }),
    });

    if (!timeZone && result.type === "widget") {
      await ctx.reply(timezoneWarning, {
        reply_markup: mainMenu,
      });
      return;
    }

    if (result.type === "widget") {
      await ctx.reply("Меню управления ниже.", { reply_markup: mainMenu });
      return;
    }
    return;
  }

  if (action === "dailyReport") {
    setPendingInput(chatId, "dailyReportMenu");
    await ctx.reply("Выбери дату для ежедневного отчета.", {
      reply_markup: buildDailyReportMenuReplyKeyboard(),
    });
    return;
  }

  setPendingInput(chatId, "dateMenu");
  const today = timeZone ? formatDateInTimeZone(new Date(), timeZone) : formatDateLocal(new Date());
  const dateButtons = getNextIsoDates(today, 7).map((date) => {
    const weekday = getWeekdayShortRu(date);
    const label = formatDateForDisplay(date);
    return weekday ? `${label} (${weekday})` : label;
  });
  await ctx.reply(DATE_MENU_PROMPT_TEXT, {
    reply_markup: buildDateMenuReplyKeyboard({ dateButtons }),
  });
};
