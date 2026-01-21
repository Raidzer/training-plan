import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

type HelpMenuActionArgs = {
  ctx: any;
  userId: number;
};

export const handleHelpMenuAction = async ({ ctx, userId }: HelpMenuActionArgs) => {
  const helpMessage = [
    "Что умеет бот:",
    " Сегодня - показать план на сегодня.",
    " Дата - запрос плана на конкретную дату.",
    " Заполнить дневник - записать вес, сон и восстановление.",
    " Подписка - включить/выключить рассылку.",
    " Время рассылки - установить время.",
    " Таймзона - установить часовой пояс.",
    " Отвязать - удалить связь с аккаунтом.",
  ].join("\n");
  const subscription = await getSubscription(userId);
  await ctx.reply(helpMessage, {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    }),
  });
};
