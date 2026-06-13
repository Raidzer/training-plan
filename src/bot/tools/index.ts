import "dotenv/config";
import { Bot, GrammyError, HttpError } from "grammy";
import { TOOLS_BOT_NAME } from "@/bot/tools/constants/toolsBotConstants";
import { registerToolsCommands } from "@/bot/tools/commands/registerToolsCommands";
import { buildToolsWebAppUrl } from "@/bot/tools/utils/toolsBotUrl";

const token = process.env.TELEGRAM_TOOLS_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_TOOLS_BOT_TOKEN не задан");
}

const webAppUrl = buildToolsWebAppUrl();
const bot = new Bot(token);

registerToolsCommands(bot, { webAppUrl });

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
console.log(`${TOOLS_BOT_NAME} запущен`);
