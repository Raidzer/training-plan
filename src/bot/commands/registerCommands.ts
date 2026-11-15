import type { Bot } from "grammy";
import { registerAccountCommands } from "@/bot/commands/handlers/accountCommands";
import { registerKeyboardCommands } from "@/bot/commands/handlers/keyboardCommands";
import { registerPlanCommands } from "@/bot/commands/handlers/planCommands";
import { registerSubscriptionCommands } from "@/bot/commands/handlers/subscriptionCommands";
import { registerTextMessageHandler } from "@/bot/commands/handlers/textMessageHandler";
import { registerCompetitionResultCommands } from "@/bot/commands/handlers/competitionResultCommands";
import { registerPlanCalendarQueryHandler } from "@/bot/messages/planCalendarHandler";

export const registerCommands = (bot: Bot) => {
  registerPlanCalendarQueryHandler(bot);
  registerAccountCommands(bot);
  registerPlanCommands(bot);
  registerSubscriptionCommands(bot);
  registerKeyboardCommands(bot);
  registerCompetitionResultCommands(bot);
  registerTextMessageHandler(bot);
};
