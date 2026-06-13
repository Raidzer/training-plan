import type { Bot, Context } from "grammy";
import { TOOLS_BOT_MESSAGES } from "@/bot/tools/constants/toolsBotConstants";
import { buildToolsWebAppReplyKeyboard } from "@/bot/tools/keyboards/toolsKeyboard";
import { buildToolsWebAppUrl } from "@/bot/tools/utils/toolsBotUrl";

type RegisterToolsCommandsParams = {
  webAppUrl?: string;
};

const replyWithToolsKeyboard = async (ctx: Context, message: string, webAppUrl: string) => {
  if (ctx.chat?.type !== "private") {
    return ctx.reply(TOOLS_BOT_MESSAGES.privateOnly);
  }

  return ctx.reply(message, {
    reply_markup: buildToolsWebAppReplyKeyboard(webAppUrl),
  });
};

export const registerToolsCommands = (bot: Bot, params?: RegisterToolsCommandsParams) => {
  const webAppUrl = params?.webAppUrl ?? buildToolsWebAppUrl();

  bot.command("start", async (ctx) => {
    return replyWithToolsKeyboard(ctx, TOOLS_BOT_MESSAGES.start, webAppUrl);
  });

  bot.command("menu", async (ctx) => {
    return replyWithToolsKeyboard(ctx, TOOLS_BOT_MESSAGES.start, webAppUrl);
  });

  bot.command("help", async (ctx) => {
    return replyWithToolsKeyboard(ctx, TOOLS_BOT_MESSAGES.help, webAppUrl);
  });
};
