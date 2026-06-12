import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildMainMenuReplyKeyboard,
  DAILY_REPORT_BUTTON_TEXT,
  DATE_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  HIDE_MENU_BUTTON_TEXT,
  SUBSCRIBE_OFF_BUTTON_TEXT,
  SUBSCRIBE_ON_BUTTON_TEXT,
  TIME_BUTTON_TEXT,
  TIMEZONE_BUTTON_TEXT,
  TODAY_BUTTON_TEXT,
  UNLINK_BUTTON_TEXT,
  WEIGHT_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";

type HelpMenuActionArgs = {
  ctx: any;
  userId: number;
};

export const handleHelpMenuAction = async ({ ctx, userId }: HelpMenuActionArgs) => {
  const helpMessage = [
    "Что умеет бот:",
    `- ${TODAY_BUTTON_TEXT} - показать план на сегодня.`,
    `- ${DATE_BUTTON_TEXT} - запрос плана на конкретную дату.`,
    `- ${DAILY_REPORT_BUTTON_TEXT} - сформировать отчет за сегодня.`,
    `- ${WEIGHT_BUTTON_TEXT} - записать вес, сон и восстановление.`,
    `- ${SUBSCRIBE_OFF_BUTTON_TEXT}/${SUBSCRIBE_ON_BUTTON_TEXT} - включить/выключить рассылку.`,
    `- ${TIME_BUTTON_TEXT} - установить время.`,
    `- ${TIMEZONE_BUTTON_TEXT} - установить часовой пояс.`,
    `- ${UNLINK_BUTTON_TEXT} - удалить связь с аккаунтом.`,
    `- ${HELP_BUTTON_TEXT} - показать справку.`,
    `- ${HIDE_MENU_BUTTON_TEXT} - убрать клавиатуру. Ее также можно свернуть жестом, вернуть - командой /menu.`,
  ].join("\n");
  const subscription = await getSubscription(userId);
  await ctx.reply(helpMessage, {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    }),
  });
};
