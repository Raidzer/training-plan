import "dotenv/config";
import { Bot } from "grammy";
import { registerCommands } from "@/bot/commands/registerCommands";
import { startDispatchScheduler } from "@/bot/scheduler/dispatchPlan";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN не задан");
}

const bot = new Bot(token);

registerCommands(bot);

bot.catch((error: any) => {
  console.error("Ошибка Telegram-бота", error);
});

bot.start();
console.log("Telegram-бот запущен");

startDispatchScheduler(bot);
