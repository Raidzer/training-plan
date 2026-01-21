import "dotenv/config";
import { Bot, GrammyError, HttpError } from "grammy";
import { registerCommands } from "@/bot/commands/registerCommands";
import { startDispatchScheduler } from "@/bot/scheduler/dispatchPlan";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN не задан");
}

const bot = new Bot(token);

registerCommands(bot);

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
console.log("Telegram-бот запущен");

startDispatchScheduler(bot);
