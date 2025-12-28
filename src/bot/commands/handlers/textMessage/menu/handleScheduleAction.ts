import { setPendingInput } from "@/bot/menu/menuState";

type ScheduleMenuActionArgs = {
  ctx: any;
  chatId: number;
  action: "time" | "timezone";
};

export const handleScheduleMenuAction = async ({
  ctx,
  chatId,
  action,
}: ScheduleMenuActionArgs) => {
  setPendingInput(chatId, action);
  if (action === "time") {
    await ctx.reply(
      "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
    );
    return;
  }

  await ctx.reply(
    "Введите таймзону IANA (например, Europe/Moscow) или напишите 'отмена'."
  );
};
