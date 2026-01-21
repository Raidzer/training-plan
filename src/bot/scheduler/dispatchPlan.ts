import type { Bot } from "grammy";
import { getPlanEntriesByDate } from "@/lib/planEntries";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import { normalizeDateValue, getZonedDateTime } from "@/bot/utils/dateTime";
import {
  getEnabledSubscriptions,
  markSubscriptionSent,
} from "@/bot/services/telegramSubscriptions";

const DISPATCH_INTERVAL_MS = 30_000;
let dispatchRunning = false;

const dispatchDueSubscriptions = async (bot: Bot) => {
  if (dispatchRunning) {
    return;
  }
  dispatchRunning = true;

  try {
    const subscriptions = await getEnabledSubscriptions();
    if (!subscriptions.length) {
      return;
    }

    const now = new Date();

    for (const subscription of subscriptions) {
      if (!subscription.timezone || !subscription.sendTime) {
        continue;
      }

      let zoned;
      try {
        zoned = getZonedDateTime(now, subscription.timezone);
      } catch (error) {
        console.error("Ошибка таймзоны", subscription.timezone, error);
        continue;
      }

      if (zoned.time !== subscription.sendTime) {
        continue;
      }

      const lastSent = normalizeDateValue(subscription.lastSentOn);
      if (lastSent === zoned.date) {
        continue;
      }

      const entries = await getPlanEntriesByDate({
        userId: subscription.userId,
        date: zoned.date,
      });
      const message = formatPlanMessage({
        date: zoned.date,
        entries,
        sendTime: subscription.sendTime,
      });

      try {
        await bot.api.sendMessage(subscription.chatId, message);
        await markSubscriptionSent({ id: subscription.id, sentOn: zoned.date });
      } catch (error) {
        console.error("Ошибка рассылки", subscription.chatId, error);
      }
    }
  } finally {
    dispatchRunning = false;
  }
};

export const startDispatchScheduler = (bot: Bot) => {
  const run = () =>
    dispatchDueSubscriptions(bot).catch((error) => {
      console.error("Ошибка фоновой рассылки", error);
    });

  run();
  return setInterval(run, DISPATCH_INTERVAL_MS);
};
