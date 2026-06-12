import { TIME_REGEX } from "@/bot/utils/validators";
import { resolveTimeZoneInput } from "@/bot/utils/dateTime";
import { getSubscription, upsertSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildMainMenuReplyKeyboard,
  buildTimeReplyKeyboard,
  buildTimezoneReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
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

    if (!TIME_REGEX.test(text)) {
      await ctx.reply("Выберите время кнопкой или напишите новое в формате HH:MM.", {
        reply_markup: buildTimeReplyKeyboard(),
      });
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

  const resolved = resolveTimeZoneInput(text);
  if (!resolved) {
    const subscription = await getSubscription(userId);
    await ctx.reply("Неверная таймзона. Выберите вариант кнопкой или напишите IANA/смещение.", {
      reply_markup: buildTimezoneReplyKeyboard({
        currentTimeZone: subscription?.timezone ?? null,
      }),
    });
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
