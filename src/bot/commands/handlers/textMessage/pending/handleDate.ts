import { parseDisplayDate } from "@/bot/utils/dateTime";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import {
  buildMainMenuReplyKeyboard,
  CUSTOM_DATE_BUTTON_TEXT,
  DATE_BACK_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, setPendingInput } from "@/bot/menu/menuState";
import { getPlanEntriesByDate } from "@/server/planEntries";

type DateHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending: "dateMenu" | "date";
  userId: number;
};

export const handleDatePending = async ({
  ctx,
  chatId,
  text,
  pending,
  userId,
}: DateHandlerArgs) => {
  if (pending === "dateMenu") {
    if (text === DATE_BACK_BUTTON_TEXT) {
      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply("Меню управления ниже.", {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (text === CUSTOM_DATE_BUTTON_TEXT) {
      setPendingInput(chatId, "date");
      await ctx.reply(
        "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или напишите 'отмена'."
      );
      return;
    }

    const parsedDate = parseDisplayDate(text);
    if (!parsedDate) {
      await ctx.reply('Выбери дату из списка или нажми "Произвольная дата".');
      return;
    }

    const entries = await getPlanEntriesByDate({ userId, date: parsedDate });
    const message = formatPlanMessage({ date: parsedDate, entries });

    clearPendingInput(chatId);
    const subscription = await getSubscription(userId);
    await ctx.reply(message, {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
    return;
  }

  const parsedDate = parseDisplayDate(text);
  if (!parsedDate) {
    await ctx.reply(
      "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или напишите 'отмена'."
    );
    return;
  }

  const entries = await getPlanEntriesByDate({ userId, date: parsedDate });
  const message = formatPlanMessage({ date: parsedDate, entries });

  clearPendingInput(chatId);
  const subscription = await getSubscription(userId);
  await ctx.reply(message, {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    }),
  });
};
