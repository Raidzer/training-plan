import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { buildTimeReplyKeyboard, buildTimezoneReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";

type ScheduleMenuActionArgs = {
  ctx: any;
  chatId: number;
  action: "time" | "timezone";
  userId: number;
};

export const handleScheduleMenuAction = async ({
  ctx,
  chatId,
  action,
  userId,
}: ScheduleMenuActionArgs) => {
  setPendingInput(chatId, action);
  if (action === "time") {
    await ctx.reply("Выберите время кнопкой или напишите новое в формате HH:MM.", {
      reply_markup: buildTimeReplyKeyboard(),
    });
    return;
  }

  const subscription = await getSubscription(userId);
  const timeZone = subscription?.timezone ?? "не задана";
  await ctx.reply(
    `Текущая таймзона: ${timeZone}. Выберите таймзону кнопкой или напишите новую IANA/смещение, например Europe/Moscow или +3.`,
    {
      reply_markup: buildTimezoneReplyKeyboard({
        currentTimeZone: subscription?.timezone ?? null,
      }),
    }
  );
};
