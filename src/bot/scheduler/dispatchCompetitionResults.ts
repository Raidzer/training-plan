import type { Bot } from "grammy";
import { getEnabledSubscriptions } from "@/bot/services/telegramSubscriptions";
import { addDaysToIsoDate, getZonedDateTime } from "@/bot/utils/dateTime";
import {
  buildCompetitionResultKeyboard,
  formatCompetitionResultRequest,
} from "@/bot/messages/competitionResultMessage";
import {
  claimCompetitionResultRequest,
  listDueCompetitions,
  markCompetitionResultRequestSent,
  releaseCompetitionResultRequestClaim,
  type CompetitionResultRequestClaim,
} from "@/server/competitionResultRequests";

const DISPATCH_INTERVAL_MS = 30_000;

export const dispatchCompetitionResults = async (bot: Bot, now = new Date()) => {
  const subscriptions = await getEnabledSubscriptions();

  for (const subscription of subscriptions) {
    if (!subscription.timezone || !subscription.sendTime) {
      continue;
    }

    try {
      const zoned = getZonedDateTime(now, subscription.timezone);
      if (zoned.time < subscription.sendTime) {
        continue;
      }

      const date = addDaysToIsoDate(zoned.date, -1);
      const competitions = await listDueCompetitions({
        userId: subscription.userId,
        chatId: subscription.chatId,
        date,
      });

      for (const competition of competitions) {
        let claim: CompetitionResultRequestClaim | null = null;
        try {
          claim = await claimCompetitionResultRequest({
            userId: subscription.userId,
            chatId: subscription.chatId,
            competitionId: competition.id,
            date,
          });
          if (!claim) {
            continue;
          }

          await bot.api.sendMessage(
            subscription.chatId,
            formatCompetitionResultRequest(claim.competition),
            { reply_markup: buildCompetitionResultKeyboard(claim.id) }
          );
          await markCompetitionResultRequestSent({
            requestId: claim.id,
            leaseToken: claim.leaseToken,
          });
        } catch (error) {
          if (claim) {
            await releaseCompetitionResultRequestClaim({
              requestId: claim.id,
              leaseToken: claim.leaseToken,
            }).catch((releaseError) => {
              console.error("Не удалось освободить отправку запроса результата", releaseError);
            });
          }
          console.error("Ошибка отправки запроса результата соревнования", error);
        }
      }
    } catch (error) {
      console.error("Ошибка подготовки запроса результата соревнования", error);
    }
  }
};

export const startCompetitionResultScheduler = (bot: Bot) => {
  let running = false;
  const run = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await dispatchCompetitionResults(bot);
    } catch (error) {
      console.error("Ошибка запуска рассылки результатов соревнований", error);
    } finally {
      running = false;
    }
  };

  void run();
  return setInterval(run, DISPATCH_INTERVAL_MS);
};
