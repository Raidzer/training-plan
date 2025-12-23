import type { Bot } from "grammy";
import { registerAccountCommands } from "@/bot/commands/handlers/accountCommands";
import { registerPlanCommands } from "@/bot/commands/handlers/planCommands";
import { registerSubscriptionCommands } from "@/bot/commands/handlers/subscriptionCommands";
import { registerTextMessageHandler } from "@/bot/commands/handlers/textMessageHandler";

export const registerCommands = (bot: Bot) => {
  registerAccountCommands(bot);
  registerPlanCommands(bot);
  registerSubscriptionCommands(bot);
  registerTextMessageHandler(bot);
};
