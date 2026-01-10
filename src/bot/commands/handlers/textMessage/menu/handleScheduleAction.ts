import { getSubscription } from "@/bot/services/telegramSubscriptions";
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
    await ctx.reply("Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'.");
    return;
  }

  const subscription = await getSubscription(userId);
  const timeZone = subscription?.timezone ?? "не задана";
  await ctx.reply(
    `Текущая таймзона: ${timeZone}. Введите IANA (например, Europe/Moscow) или смещение (например, +3), либо напишите 'отмена'.`
  );
};
