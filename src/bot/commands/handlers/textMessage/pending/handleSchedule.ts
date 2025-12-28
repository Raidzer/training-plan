import { TIME_REGEX } from "@/bot/utils/validators";
import { isValidTimeZone } from "@/bot/utils/dateTime";
import {
  getSubscription,
  upsertSubscription,
} from "@/bot/services/telegramSubscriptions";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { clearPendingInput } from "@/bot/menu/menuState";

type ScheduleHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending: "time" | "timezone";
  userId: number;
};

export const handleSchedulePending = async ({
  ctx,
  chatId,
  text,
  pending,
  userId,
}: ScheduleHandlerArgs) => {
  if (pending === "time") {
    if (!TIME_REGEX.test(text)) {
      await ctx.reply(
        "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
      );
      return;
    }

    await upsertSubscription({
      userId,
      chatId,
      patch: { sendTime: text },
    });

    clearPendingInput(chatId);
    const subscription = await getSubscription(userId);
    await ctx.reply(`Время рассылки обновлено: ${text}.`, {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
    return;
  }

  if (!isValidTimeZone(text)) {
    await ctx.reply(
      "Неверная таймзона. Пример: Europe/Moscow. Или напишите 'отмена'."
    );
    return;
  }

  await upsertSubscription({
    userId,
    chatId,
    patch: { timezone: text },
  });

  clearPendingInput(chatId);
  const subscription = await getSubscription(userId);
  await ctx.reply(`Таймзона обновлена: ${text}.`, {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    }),
  });
};
