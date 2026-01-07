import { TIME_REGEX } from "@/bot/utils/validators";
import { resolveTimeZoneInput } from "@/bot/utils/dateTime";
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

  const resolved = resolveTimeZoneInput(text);
  if (!resolved) {
    await ctx.reply(
      "Неверная таймзона. Пример: Europe/Moscow или +3. Или напишите 'отмена'."
    );
    return;
  }

  await upsertSubscription({
    userId,
    chatId,
    patch: { timezone: resolved.timeZone },
  });

  clearPendingInput(chatId);
  const subscription = await getSubscription(userId);
  const displayTimeZone =
    resolved.type === "offset"
      ? `${resolved.timeZone} (смещение ${resolved.offset >= 0 ? "+" : ""}${resolved.offset})`
      : resolved.timeZone;
  await ctx.reply(`Таймзона обновлена: ${displayTimeZone}.`, {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    }),
  });
};
