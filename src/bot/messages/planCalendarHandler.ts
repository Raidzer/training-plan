import { ensureLinked } from "@/bot/services/telegramAccounts";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import { sendLongPlanText } from "@/bot/messages/planWidget";
import {
  buildCalendarQueryResponse,
  buildPlanCalendarWidgetPayload,
  createCalendarWidgetState,
  isValidCalendarDate,
  isValidCalendarMonth,
  serializeCalendarWidgetState,
  shouldSendCalendarPlanText,
} from "@/bot/messages/planCalendarWidget";
import { getPlanDatesByMonth, getPlanEntriesByDate } from "@/server/planEntries";
import type { PlanEntrySummary } from "@/server/planEntries";

type RawWidgetApi = {
  sendWidget?: (payload: unknown) => Promise<unknown>;
  answerWidgetQuery?: (payload: { widget_query_id: string; data: string }) => Promise<unknown>;
  editMessageWidgetData?: (payload: {
    chat_id: number;
    message_id: number;
    chat_data: string;
  }) => Promise<unknown>;
};

type CalendarWidgetContext = {
  api?: {
    raw?: RawWidgetApi;
    sendMessage?: (chatId: number, text: string) => Promise<unknown>;
  };
  update?: {
    widget_query?: {
      id: string;
      chat?: { id: number; type: string };
      message_id?: number;
      data?: string;
    };
  };
};

const getRawWidgetApi = (ctx: CalendarWidgetContext) => ctx.api?.raw;

export const sendPlanCalendarWidget = async (params: {
  ctx: CalendarWidgetContext;
  chatId: number;
  userId: number;
  month: string;
}) => {
  const rawApi = getRawWidgetApi(params.ctx);
  if (typeof rawApi?.sendWidget !== "function") {
    return { type: "unavailable" as const };
  }

  let planDates: string[];
  try {
    planDates = await getPlanDatesByMonth({ userId: params.userId, month: params.month });
  } catch (error) {
    console.error("Не удалось загрузить даты плана для календаря", error);
    return { type: "failed" as const };
  }
  const payload = buildPlanCalendarWidgetPayload({
    chatId: params.chatId,
    month: params.month,
    planDates,
  });
  if (!payload) {
    return { type: "unavailable" as const };
  }

  try {
    await rawApi.sendWidget(payload);
    return { type: "widget" as const };
  } catch (error) {
    console.error("Не удалось отправить календарь плана", error);
    return { type: "failed" as const };
  }
};

const answerWidgetQuery = async (ctx: CalendarWidgetContext, queryId: string, data: string) => {
  const answer = getRawWidgetApi(ctx)?.answerWidgetQuery;
  if (typeof answer !== "function") {
    return false;
  }

  try {
    await answer({ widget_query_id: queryId, data });
    return true;
  } catch (error) {
    console.error("Не удалось ответить на запрос календаря", error);
    return false;
  }
};

const persistWidgetState = async (params: {
  ctx: CalendarWidgetContext;
  chatId: number;
  messageId?: number | undefined;
  state: ReturnType<typeof createCalendarWidgetState>;
}) => {
  if (!params.messageId) {
    return;
  }

  const edit = getRawWidgetApi(params.ctx)?.editMessageWidgetData;
  const chatData = serializeCalendarWidgetState(params.state);
  if (typeof edit !== "function" || !chatData) {
    return;
  }

  try {
    await edit({ chat_id: params.chatId, message_id: params.messageId, chat_data: chatData });
  } catch (error) {
    console.error("Не удалось сохранить состояние календаря", error);
  }
};

const getQueryResponse = async (params: {
  ctx: CalendarWidgetContext;
  chatId: number;
  userId: number;
  queryId: string;
  messageId?: number | undefined;
  data: string;
}) => {
  const { data } = params;
  const monthMatch = /^month:(\d{4}-\d{2})$/.exec(data);
  const dateMatch = /^date:(\d{4}-\d{2}-\d{2})$/.exec(data);
  if (!monthMatch && !dateMatch) {
    await answerWidgetQuery(
      params.ctx,
      params.queryId,
      JSON.stringify({ notice: "Некорректный запрос." })
    );
    return;
  }

  const month = monthMatch ? monthMatch[1] : dateMatch?.[1].slice(0, 7);
  if (!month || !isValidCalendarMonth(month)) {
    await answerWidgetQuery(
      params.ctx,
      params.queryId,
      JSON.stringify({ notice: "Некорректный месяц." })
    );
    return;
  }

  const planDates = await getPlanDatesByMonth({ userId: params.userId, month });
  let selectedDate: string | null = null;
  let planEntries: PlanEntrySummary[] = [];
  let notice: string | null = null;

  if (dateMatch) {
    selectedDate = dateMatch[1];
    if (!isValidCalendarDate(selectedDate)) {
      await answerWidgetQuery(
        params.ctx,
        params.queryId,
        JSON.stringify({ notice: "Некорректная дата." })
      );
      return;
    }

    planEntries = await getPlanEntriesByDate({ userId: params.userId, date: selectedDate });
    if (!planEntries.length) {
      notice = "На эту дату тренировка не запланирована.";
    } else if (shouldSendCalendarPlanText(planEntries)) {
      notice = "Полный план отправлен отдельным сообщением.";
      const sendMessage = params.ctx.api?.sendMessage;
      if (typeof sendMessage === "function") {
        await sendLongPlanText(
          (text) => sendMessage(params.chatId, text),
          formatPlanMessage({ date: selectedDate, entries: planEntries })
        );
      }
    }
  }

  const state = createCalendarWidgetState({
    month,
    planDates,
    selectedDate,
    planEntries,
    notice,
  });
  await persistWidgetState({
    ctx: params.ctx,
    chatId: params.chatId,
    messageId: params.messageId,
    state,
  });
  await answerWidgetQuery(params.ctx, params.queryId, buildCalendarQueryResponse(state));
};

export const handlePlanCalendarQuery = async (ctx: CalendarWidgetContext) => {
  const query = ctx.update?.widget_query;
  if (!query || !query.id || !query.chat || query.chat.type !== "private") {
    return false;
  }

  try {
    const userId = await ensureLinked(query.chat.id);
    if (!userId) {
      await answerWidgetQuery(
        ctx,
        query.id,
        JSON.stringify({ notice: "Сначала свяжите аккаунт с Telegram." })
      );
      return true;
    }

    await getQueryResponse({
      ctx,
      chatId: query.chat.id,
      userId,
      queryId: query.id,
      messageId: query.message_id,
      data: query.data ?? "",
    });
  } catch (error) {
    console.error("Не удалось обработать запрос календаря", error);
    await answerWidgetQuery(
      ctx,
      query.id,
      JSON.stringify({ notice: "Не удалось загрузить план." })
    );
  }
  return true;
};

export const registerPlanCalendarQueryHandler = (bot: {
  use?: (handler: (ctx: any, next: () => Promise<void>) => Promise<void>) => void;
}) => {
  if (typeof bot.use !== "function") {
    return;
  }

  bot.use(async (ctx, next) => {
    if (ctx.update?.widget_query) {
      const handled = await handlePlanCalendarQuery(ctx);
      if (handled) {
        return;
      }
    }

    await next();
  });
};
