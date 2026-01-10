import {
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  getNextIsoDates,
  getWeekdayShortRu,
} from "@/bot/utils/dateTime";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import { buildDateMenuReplyKeyboard, buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";
import { getPlanEntriesByDate } from "@/lib/planEntries";

type PlanMenuActionArgs = {
  ctx: any;
  chatId: number;
  userId: number;
  action: "today" | "date";
};

export const handlePlanMenuAction = async ({ ctx, chatId, userId, action }: PlanMenuActionArgs) => {
  const subscription = await getSubscription(userId);
  const timeZone = subscription?.timezone ?? null;

  if (action === "today") {
    const today = timeZone
      ? formatDateInTimeZone(new Date(), timeZone)
      : formatDateLocal(new Date());

    const entries = await getPlanEntriesByDate({ userId, date: today });
    const message = formatPlanMessage({ date: today, entries });

    if (!timeZone) {
      await ctx.reply(`${message}\n\nТаймзона не задана, использую время сервера.`, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    await ctx.reply(message, {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
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
  await ctx.reply('Выбери дату из списка или нажми "Произвольная дата".', {
    reply_markup: buildDateMenuReplyKeyboard({ dateButtons }),
  });
};
