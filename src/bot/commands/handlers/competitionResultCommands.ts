import type { Bot, Context } from "grammy";
import {
  COMPETITION_RECORD_STATUS_TEXT,
  COMPETITION_RESULT_TEXT,
} from "@/bot/constants/competitionResultConstants";
import {
  buildCompetitionRecordKeyboard,
  formatCompetitionRecordOffer,
  formatCompetitionResultPrompt,
} from "@/bot/messages/competitionResultMessage";
import { getPendingInput } from "@/bot/menu/menuState";
import {
  confirmCompetitionResultRecord,
  findCompetitionResultRequestByPrompt,
  getCompetitionResultRequest,
  saveCompetitionResult,
  setCompetitionResultPrompt,
  skipCompetitionResult,
  type CompetitionResultRequest,
} from "@/server/competitionResultRequests";
import { getPersonalRecords } from "@/server/personalRecords";
import {
  getPersonalRecordDistanceKey,
  parsePersonalRecordTime,
} from "@/shared/utils/personalRecordUtils";

const isPending = (request: CompetitionResultRequest) =>
  !request.competition.isSkipped && !request.competition.result?.trim();

const removeButtons = async (ctx: Context) => {
  await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }).catch((error) => {
    console.error("Не удалось убрать кнопки запроса результата", error);
  });
};

const offerPersonalRecord = async (ctx: Context, request: CompetitionResultRequest) => {
  const competition = request.competition;
  const distanceKey = getPersonalRecordDistanceKey(competition.distanceLabel);
  const time = parsePersonalRecordTime(competition.result ?? "");
  if (!distanceKey || !time) {
    return;
  }

  try {
    const records = await getPersonalRecords({ userId: request.userId });
    const current = records.find((record) => record.distanceKey === distanceKey);
    const currentTime = current ? parsePersonalRecordTime(current.timeText) : null;
    if (current && !currentTime) {
      await ctx.reply(COMPETITION_RESULT_TEXT.invalidCurrentRecord);
      return;
    }
    if (currentTime && time.hundredths >= currentTime.hundredths) {
      return;
    }

    await ctx.reply(
      formatCompetitionRecordOffer({
        competition,
        timeText: time.timeText,
        previousTimeText: currentTime?.timeText ?? null,
      }),
      { reply_markup: buildCompetitionRecordKeyboard(request.id) }
    );
  } catch (error) {
    console.error("Ошибка проверки рекорда после результата соревнования", error);
    await ctx.reply(COMPETITION_RESULT_TEXT.recordCheckError);
  }
};

export const registerCompetitionResultCommands = (bot: Bot) => {
  bot.callbackQuery(/^competition:(\d+):(result|skip|record|dismiss)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat || ctx.chat.type !== "private") {
      return;
    }

    const requestId = Number(ctx.match[1]);
    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      return;
    }

    const params = { requestId, chatId: ctx.chat.id };
    const action = ctx.match[2];
    try {
      const request = await getCompetitionResultRequest(params);
      if (!request) {
        await ctx.reply(COMPETITION_RESULT_TEXT.stale);
        await removeButtons(ctx);
        return;
      }

      if (action === "record") {
        const status = await confirmCompetitionResultRecord(params);
        await ctx.reply(COMPETITION_RECORD_STATUS_TEXT[status]);
        await removeButtons(ctx);
        return;
      }
      if (action === "dismiss") {
        await ctx.reply(COMPETITION_RESULT_TEXT.recordDismissed);
        await removeButtons(ctx);
        return;
      }
      if (!isPending(request)) {
        await ctx.reply(COMPETITION_RESULT_TEXT.stale);
        await removeButtons(ctx);
        return;
      }

      if (action === "skip") {
        const competition = await skipCompetitionResult(params);
        await ctx.reply(
          competition
            ? `Пропущено: «${competition.nameLocation}». Отметка сохранена.`
            : COMPETITION_RESULT_TEXT.stale
        );
        await removeButtons(ctx);
        return;
      }

      if (getPendingInput(params.chatId)) {
        await ctx.reply(COMPETITION_RESULT_TEXT.busy);
        return;
      }

      const prompt = await ctx.reply(formatCompetitionResultPrompt(request.competition), {
        reply_markup: { force_reply: true, input_field_placeholder: "39:30 или 01:42:15" },
      });
      const saved = await setCompetitionResultPrompt({
        ...params,
        promptMessageId: prompt.message_id,
      });
      if (!saved) {
        await ctx.reply(COMPETITION_RESULT_TEXT.stale);
      }
    } catch (error) {
      console.error("Ошибка действия с результатом соревнования", error);
      await ctx.reply(COMPETITION_RESULT_TEXT.error);
    }
  });

  bot.on("message:text", async (ctx, next) => {
    const replyTo = ctx.message.reply_to_message;
    const text = ctx.message.text.trim();
    if (
      ctx.chat.type !== "private" ||
      text.startsWith("/") ||
      !replyTo?.text?.startsWith(COMPETITION_RESULT_TEXT.promptPrefix) ||
      replyTo.from?.id !== ctx.me.id
    ) {
      await next();
      return;
    }

    let saved: CompetitionResultRequest | null = null;
    try {
      const found = await findCompetitionResultRequestByPrompt({
        chatId: ctx.chat.id,
        promptMessageId: replyTo.message_id,
      });
      if (!found?.request || !isPending(found.request)) {
        await ctx.reply(COMPETITION_RESULT_TEXT.stale);
        return;
      }
      if (getPendingInput(ctx.chat.id)) {
        await ctx.reply(COMPETITION_RESULT_TEXT.busy);
        return;
      }

      const time = parsePersonalRecordTime(text);
      if (!time) {
        await ctx.reply(COMPETITION_RESULT_TEXT.invalidTime);
        return;
      }

      saved = await saveCompetitionResult({
        requestId: found.id,
        chatId: ctx.chat.id,
        result: time.timeText,
      });
      if (!saved) {
        await ctx.reply(COMPETITION_RESULT_TEXT.stale);
        return;
      }

      await ctx.reply(
        `Результат соревнования «${saved.competition.nameLocation}» сохранён: ${saved.competition.result}.`
      );
      await offerPersonalRecord(ctx, saved);
    } catch (error) {
      console.error("Ошибка ввода результата соревнования", error);
      await ctx.reply(
        saved ? COMPETITION_RESULT_TEXT.recordCheckError : COMPETITION_RESULT_TEXT.error
      );
    }
  });
};
