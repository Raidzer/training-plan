import type { Bot } from "grammy";
import { TIME_REGEX } from "@/bot/utils/validators";
import {
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  getNextIsoDates,
  getWeekdayShortRu,
  isValidTimeZone,
  parseDisplayDate,
} from "@/bot/utils/dateTime";
import { ensureLinked, unlinkAccount } from "@/bot/services/telegramAccounts";
import {
  getSubscription,
  upsertSubscription,
} from "@/bot/services/telegramSubscriptions";
import { linkAccount } from "@/bot/services/telegramLinking";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import {
  buildCancelLinkReplyKeyboard,
  buildDateMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  buildWeightActionReplyKeyboard,
  buildWeightDateReplyKeyboard,
  buildWeightPeriodReplyKeyboard,
  buildWorkoutEditReplyKeyboard,
  buildWorkoutSelectReplyKeyboard,
  CANCEL_LINK_BUTTON_TEXT,
  CUSTOM_DATE_BUTTON_TEXT,
  DATE_BACK_BUTTON_TEXT,
  REPORT_EDIT_COMMENT_BUTTON_TEXT,
  REPORT_EDIT_RESULT_BUTTON_TEXT,
  REPORT_EDIT_TIME_BUTTON_TEXT,
  REPORT_WEIGHT_BUTTON_TEXT,
  REPORT_WORKOUT_BUTTON_TEXT,
  REPORT_MAIN_MENU_BUTTON_TEXT,
  WEIGHT_CUSTOM_DATE_BUTTON_TEXT,
  WEIGHT_EVENING_BUTTON_TEXT,
  WEIGHT_MORNING_BUTTON_TEXT,
  WEIGHT_TODAY_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearWeightDraft,
  clearWorkoutDraft,
  getPendingInput,
  getWeightDraft,
  getWorkoutDraft,
  setPendingInput,
  setWeightDraft,
  setWorkoutDraft,
} from "@/bot/menu/menuState";
import { getMenuActionByText } from "@/bot/commands/handlers/helpers";
import { upsertWeightEntry } from "@/lib/weightEntries";
import { getPlanEntriesByDate } from "@/lib/planEntries";
import {
  getWorkoutReportByPlanEntry,
  upsertWorkoutReport,
} from "@/lib/workoutReports";

export const registerTextMessageHandler = (bot: Bot) => {
  bot.on("message:text", async (ctx: any) => {
    if (!ctx.chat || ctx.chat.type !== "private") {
      return;
    }

    const text = ctx.message?.text?.trim() ?? "";
    if (!text || text.startsWith("/")) {
      return;
    }

    const chatId = ctx.chat.id;
    const pending = getPendingInput(chatId);
    const action = getMenuActionByText(text);

    if (!pending && action) {
      if (action === "cancelLink") {
        clearPendingInput(chatId);
        await ctx.reply("Привязка отменена.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
        return;
      }

      if (action === "link") {
        clearPendingInput(chatId);
        const userId = await ensureLinked(chatId);
        if (userId) {
          const subscription = await getSubscription(userId);
          await ctx.reply("Аккаунт уже связан.", {
            reply_markup: buildMainMenuReplyKeyboard({
              subscribed: subscription?.enabled ?? false,
            }),
          });
          return;
        }

        setPendingInput(chatId, "link");
        await ctx.reply("Введите 6-значный код с сайта.", {
          reply_markup: { force_reply: true },
        });
        await ctx.reply(
          "Если передумали, нажмите кнопку <Отменить привязку>.",
          { reply_markup: buildCancelLinkReplyKeyboard() }
        );
        return;
      }

      const userId = await ensureLinked(chatId);
      if (!userId) {
        await ctx.reply("Сначала свяжите аккаунт командой /link.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
        return;
      }

      if (action === "today") {
        const subscription = await getSubscription(userId);
        const timeZone = subscription?.timezone ?? null;
        const today = timeZone
          ? formatDateInTimeZone(new Date(), timeZone)
          : formatDateLocal(new Date());

        const entries = await getPlanEntriesByDate({ userId, date: today });
        const message = formatPlanMessage({ date: today, entries });

        if (!timeZone) {
          await ctx.reply(
            `${message}\n\nТаймзона не задана, использую время сервера.`,
            {
              reply_markup: buildMainMenuReplyKeyboard({
                subscribed: subscription?.enabled ?? false,
              }),
            }
          );
          return;
        }

        await ctx.reply(message, {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      if (action === "date") {
        setPendingInput(chatId, "dateMenu");
        const subscription = await getSubscription(userId);
        const timeZone = subscription?.timezone ?? null;
        const today = timeZone
          ? formatDateInTimeZone(new Date(), timeZone)
          : formatDateLocal(new Date());
        const dateButtons = getNextIsoDates(today, 7).map((date) => {
          const weekday = getWeekdayShortRu(date);
          const label = formatDateForDisplay(date);
          return weekday ? `${label} (${weekday})` : label;
        });
        await ctx.reply(
          "Выбери дату из списка или нажми \"Произвольная дата\".",
          {
            reply_markup: buildDateMenuReplyKeyboard({ dateButtons }),
          }
        );
        return;
      }

      if (action === "weight") {
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Когда зафиксировать вес?", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      if (action === "time") {
        setPendingInput(chatId, "time");
        await ctx.reply(
          "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      if (action === "timezone") {
        setPendingInput(chatId, "timezone");
        await ctx.reply(
          "Введите таймзону IANA (например, Europe/Moscow) или напишите 'отмена'."
        );
        return;
      }

      if (action === "subscribe" || action === "unsubscribe") {
        await upsertSubscription({
          userId,
          chatId,
          patch: { enabled: action === "subscribe" },
        });

        const subscription = await getSubscription(userId);
        if (action === "subscribe") {
          if (!subscription?.timezone || !subscription.sendTime) {
            await ctx.reply(
              "Подписка включена, но нужно задать /timezone и /time, чтобы получать рассылку.",
              {
                reply_markup: buildMainMenuReplyKeyboard({
                  subscribed: subscription?.enabled ?? false,
                }),
              }
            );
            return;
          }
          await ctx.reply("Подписка включена.", {
            reply_markup: buildMainMenuReplyKeyboard({
              subscribed: subscription?.enabled ?? false,
            }),
          });
          return;
        }

        await ctx.reply("Подписка выключена.", {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      if (action === "unlink") {
        await unlinkAccount(chatId);
        await ctx.reply("Связка удалена. Теперь можно привязать другой аккаунт.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
        return;
      }

      if (action === "help") {
        const helpMessage = [
          "Что умеет бот:",
          " Сегодня - показать план на сегодня.",
          " Дата - запрос плана на конкретную дату.",
          " Заполнить отчет - записать вес или отчет по тренировке.",
          " Подписка - включить/выключить рассылку.",
          " Время рассылки - установить время.",
          " Таймзона - установить часовой пояс.",
          " Отвязать - удалить связь с аккаунтом.",
        ].join("\n");
        const subscription = await getSubscription(userId);
        await ctx.reply(helpMessage, {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }
    }

    if (!pending) {
      return;
    }

    const lower = text.toLowerCase();
    if (
      lower === "отмена" ||
      lower === "cancel" ||
      lower === "/cancel" ||
      text === CANCEL_LINK_BUTTON_TEXT
    ) {
      clearPendingInput(chatId);
      clearWeightDraft(chatId);
      clearWorkoutDraft(chatId);
      const userId = await ensureLinked(chatId);
      const subscription = userId ? await getSubscription(userId) : null;
      const replyMarkup =
        pending === "link" || !userId
          ? buildLinkReplyKeyboard()
          : buildMainMenuReplyKeyboard({
              subscribed: subscription?.enabled ?? false,
            });
      await ctx.reply("Ввод отменен.", { reply_markup: replyMarkup });
      return;
    }

    if (pending === "link") {
      if (!/^\d{6}$/.test(text)) {
        await ctx.reply(
          "Введите 6-значный код с сайта или напишите 'отмена'."
        );
        return;
      }

      const result = await linkAccount({
        chatId,
        code: text,
        username: ctx.from?.username ?? null,
        firstName: ctx.from?.first_name ?? null,
      });

      if (!result.ok) {
        if (result.error === "чат-уже-связан") {
          clearPendingInput(chatId);
          const userId = await ensureLinked(chatId);
          const subscription = userId ? await getSubscription(userId) : null;
          const keyboard = userId
            ? buildMainMenuReplyKeyboard({
                subscribed: subscription?.enabled ?? false,
              })
            : buildLinkReplyKeyboard();
          await ctx.reply("Этот чат уже связан с аккаунтом.", {
            reply_markup: keyboard,
          });
          return;
        }
        if (result.error === "пользователь-уже-связан") {
          await ctx.reply(
            "Аккаунт уже связан с Telegram. Попробуйте другой код или напишите 'отмена'."
          );
          return;
        }
        await ctx.reply(
          "Код недействителен или истек. Попробуйте другой или напишите 'отмена'."
        );
        return;
      }

      clearPendingInput(chatId);
      const userId = await ensureLinked(chatId);
      const subscription = userId ? await getSubscription(userId) : null;
      const keyboard = buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      });
      await ctx.reply("Аккаунт успешно связан. Меню управления ниже.", {
        reply_markup: keyboard,
      });
      return;
    }

    const userId = await ensureLinked(chatId);
    if (!userId) {
      clearPendingInput(chatId);
      await ctx.reply("Сначала свяжите аккаунт командой /link.");
      return;
    }

    if (pending === "dateMenu") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        clearPendingInput(chatId);
        const subscription = await getSubscription(userId);
        await ctx.reply("Меню управления ниже.", {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      if (text === CUSTOM_DATE_BUTTON_TEXT) {
        setPendingInput(chatId, "date");
        await ctx.reply(
          "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или напишите 'отмена'."
        );
        return;
      }

      const parsedDate = parseDisplayDate(text);
      if (!parsedDate) {
        await ctx.reply(
          "Выбери дату из списка или нажми \"Произвольная дата\"."
        );
        return;
      }

      const entries = await getPlanEntriesByDate({ userId, date: parsedDate });
      const message = formatPlanMessage({ date: parsedDate, entries });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(message, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (pending === "weightDateMenu") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        clearPendingInput(chatId);
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        const subscription = await getSubscription(userId);
        await ctx.reply("Меню управления ниже.", {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      if (text === WEIGHT_TODAY_BUTTON_TEXT) {
        const subscription = await getSubscription(userId);
        const timeZone = subscription?.timezone ?? null;
        const today = timeZone
          ? formatDateInTimeZone(new Date(), timeZone)
          : formatDateLocal(new Date());
        setWeightDraft(chatId, { date: today, period: null });
        setPendingInput(chatId, "weightAction");
        await ctx.reply("Выбери действие.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      if (text === WEIGHT_CUSTOM_DATE_BUTTON_TEXT) {
        setPendingInput(chatId, "weightDate");
        await ctx.reply(
          "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или напишите 'отмена'."
        );
        return;
      }

      await ctx.reply("Выбери дату: \"Сегодня\" или \"Произвольная дата\".", {
        reply_markup: buildWeightDateReplyKeyboard(),
      });
      return;
    }

    if (pending === "date") {
      const parsedDate = parseDisplayDate(text);
      if (!parsedDate) {
        await ctx.reply(
          "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или напишите 'отмена'."
        );
        return;
      }

      const entries = await getPlanEntriesByDate({ userId, date: parsedDate });
      const message = formatPlanMessage({ date: parsedDate, entries });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(message, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (pending === "weightDate") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Когда зафиксировать вес?", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      const parsedDate = parseDisplayDate(text);
      if (!parsedDate) {
        await ctx.reply(
          "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или напишите 'отмена'."
        );
        return;
      }

      setWeightDraft(chatId, { date: parsedDate, period: null });
      setPendingInput(chatId, "weightAction");
      await ctx.reply("Выбери действие.", {
        reply_markup: buildWeightActionReplyKeyboard(),
      });
      return;
    }

    if (pending === "weightAction") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Когда зафиксировать вес?", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      const draft = getWeightDraft(chatId);
      if (!draft.date) {
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Сначала выбери дату.", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      if (text === REPORT_WEIGHT_BUTTON_TEXT) {
        setPendingInput(chatId, "weightPeriod");
        await ctx.reply("Выбери период взвешивания.", {
          reply_markup: buildWeightPeriodReplyKeyboard(),
        });
        return;
      }

      if (text === REPORT_WORKOUT_BUTTON_TEXT) {
        const entries = await getPlanEntriesByDate({
          userId,
          date: draft.date,
        });
        if (!entries.length) {
          await ctx.reply("На выбранную дату нет тренировок в плане.");
          return;
        }

        const workoutButtons = entries.map(
          (entry) => `${entry.sessionOrder}. ${entry.taskText}`
        );
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Выбери тренировку из плана.", {
          reply_markup: buildWorkoutSelectReplyKeyboard({ workoutButtons }),
        });
        return;
      }

      if (text === REPORT_MAIN_MENU_BUTTON_TEXT) {
        clearPendingInput(chatId);
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        const subscription = await getSubscription(userId);
        await ctx.reply("Меню управления ниже.", {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      await ctx.reply("Выбери действие.", {
        reply_markup: buildWeightActionReplyKeyboard(),
      });
      return;
    }

    if (pending === "weightPeriod") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "weightAction");
        await ctx.reply("Выбери действие.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      const draft = getWeightDraft(chatId);
      if (!draft.date) {
        clearWeightDraft(chatId);
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Сначала выбери дату.", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      if (
        text === WEIGHT_MORNING_BUTTON_TEXT ||
        text === WEIGHT_EVENING_BUTTON_TEXT
      ) {
        const period =
          text === WEIGHT_MORNING_BUTTON_TEXT ? "morning" : "evening";
        const periodLabel =
          period === "morning" ? "утренний" : "вечерний";
        setWeightDraft(chatId, { period });
        setPendingInput(chatId, "weightValue");
        await ctx.reply(
          `Введите ${periodLabel} вес в кг (например, 72.4) или напишите 'отмена'.`
        );
        return;
      }

      await ctx.reply("Выбери утренний или вечерний вес.", {
        reply_markup: buildWeightPeriodReplyKeyboard(),
      });
      return;
    }

    if (pending === "time") {
      if (!TIME_REGEX.test(text)) {
        await ctx.reply(
          "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      await upsertSubscription({
        userId,
        chatId,
        patch: { sendTime: text },
      });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(`Время рассылки обновлено: ${text}.`, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (pending === "weightValue") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "weightPeriod");
        await ctx.reply("Выбери период взвешивания.", {
          reply_markup: buildWeightPeriodReplyKeyboard(),
        });
        return;
      }

      const normalized = text.replace(",", ".");
      if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)) {
        await ctx.reply(
          "Введите вес в кг (например, 72.4) или напишите 'отмена'."
        );
        return;
      }

      const weightKg = Number(normalized);
      if (!Number.isFinite(weightKg) || weightKg <= 0) {
        await ctx.reply(
          "Введите вес в кг (например, 72.4) или напишите 'отмена'."
        );
        return;
      }

      const draft = getWeightDraft(chatId);
      if (!draft.date || !draft.period) {
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Сначала выбери дату и период.", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      await upsertWeightEntry({
        userId,
        date: draft.date,
        period: draft.period,
        weightKg,
      });

      clearPendingInput(chatId);
      clearWeightDraft(chatId);
      clearWorkoutDraft(chatId);
      const subscription = await getSubscription(userId);
      const periodLabel = draft.period === "morning" ? "утро" : "вечер";
      const displayDate = formatDateForDisplay(draft.date);
      await ctx.reply(
        `Вес записан: ${weightKg} кг (${periodLabel}, ${displayDate}).`,
        {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        }
      );
      return;
    }

    if (pending === "workoutSelect") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightAction");
        await ctx.reply("Выбери действие.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      if (text === REPORT_MAIN_MENU_BUTTON_TEXT) {
        clearPendingInput(chatId);
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        const subscription = await getSubscription(userId);
        await ctx.reply("Меню управления ниже.", {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      const draft = getWeightDraft(chatId);
      if (!draft.date) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightDateMenu");
        await ctx.reply("Сначала выбери дату.", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      const entries = await getPlanEntriesByDate({
        userId,
        date: draft.date,
      });
      if (!entries.length) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "weightAction");
        await ctx.reply("На выбранную дату нет тренировок в плане.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      const orderMatch = text.match(/^\s*(\d+)\s*(?:\.|$)/);
      const selectedByOrder = orderMatch
        ? entries.find((entry) => entry.sessionOrder === Number(orderMatch[1]))
        : null;
      const selected =
        selectedByOrder ??
        entries.find((entry) => {
          const label = `${entry.sessionOrder}. ${entry.taskText}`;
          return label === text;
        });

      if (!selected) {
        const workoutButtons = entries.map(
          (entry) => `${entry.sessionOrder}. ${entry.taskText}`
        );
        await ctx.reply("Выбери тренировку из списка.", {
          reply_markup: buildWorkoutSelectReplyKeyboard({ workoutButtons }),
        });
        return;
      }

      setWorkoutDraft(chatId, {
        date: draft.date,
        planEntryId: selected.id,
        startTime: null,
        resultText: null,
      });

      const existingReport = await getWorkoutReportByPlanEntry({
        userId,
        planEntryId: selected.id,
      });
      if (existingReport) {
        setPendingInput(chatId, "workoutEditSelect");
        await ctx.reply(
          `Найден отчет: ${existingReport.startTime}. ${
            existingReport.resultText
          }${
            existingReport.commentText ? ` (${existingReport.commentText})` : ""
          }.`,
          {
            reply_markup: buildWorkoutEditReplyKeyboard(),
          }
        );
        return;
      }

      setPendingInput(chatId, "workoutStartTime");
      await ctx.reply(
        "Введите время начала тренировки в формате HH:MM (например, 07:30) или напишите 'отмена'."
      );
      return;
    }

    if (pending === "workoutStartTime") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        const dateDraft = getWeightDraft(chatId);
        if (dateDraft.date) {
          const entries = await getPlanEntriesByDate({
            userId,
            date: dateDraft.date,
          });
          const workoutButtons = entries.map(
            (entry) => `${entry.sessionOrder}. ${entry.taskText}`
          );
          await ctx.reply("Выбери тренировку из плана.", {
            reply_markup: buildWorkoutSelectReplyKeyboard({ workoutButtons }),
          });
          return;
        }

        await ctx.reply("Сначала выбери дату.", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      if (!TIME_REGEX.test(text)) {
        await ctx.reply(
          "Введите время начала в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      const draft = getWorkoutDraft(chatId);
      if (!draft.planEntryId) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Сначала выбери тренировку.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      setWorkoutDraft(chatId, { startTime: text });
      setPendingInput(chatId, "workoutResult");
      await ctx.reply("Опиши результат тренировки.");
      return;
    }

    if (pending === "workoutEditSelect") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        const dateDraft = getWeightDraft(chatId);
        if (dateDraft.date) {
          const entries = await getPlanEntriesByDate({
            userId,
            date: dateDraft.date,
          });
          const workoutButtons = entries.map(
            (entry) => `${entry.sessionOrder}. ${entry.taskText}`
          );
          await ctx.reply("Выбери тренировку из плана.", {
            reply_markup: buildWorkoutSelectReplyKeyboard({ workoutButtons }),
          });
          return;
        }

        await ctx.reply("Сначала выбери дату.", {
          reply_markup: buildWeightDateReplyKeyboard(),
        });
        return;
      }

      if (text === REPORT_MAIN_MENU_BUTTON_TEXT) {
        clearPendingInput(chatId);
        clearWeightDraft(chatId);
        clearWorkoutDraft(chatId);
        const subscription = await getSubscription(userId);
        await ctx.reply("Меню управления ниже.", {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      if (text === REPORT_EDIT_TIME_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutEditTime");
        await ctx.reply(
          "Введите время начала тренировки в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      if (text === REPORT_EDIT_RESULT_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutEditResult");
        await ctx.reply("Опиши результат тренировки.");
        return;
      }

      if (text === REPORT_EDIT_COMMENT_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutEditComment");
        await ctx.reply(
          "Добавь комментарий или напиши 'нет', чтобы очистить."
        );
        return;
      }

      await ctx.reply("Выбери, что нужно отредактировать.", {
        reply_markup: buildWorkoutEditReplyKeyboard(),
      });
      return;
    }

    if (pending === "workoutResult") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutStartTime");
        await ctx.reply(
          "Введите время начала тренировки в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      const draft = getWorkoutDraft(chatId);
      if (!draft.planEntryId || !draft.startTime) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Сначала выбери тренировку.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      setWorkoutDraft(chatId, { resultText: text });
      setPendingInput(chatId, "workoutComment");
      await ctx.reply(
        "Добавь комментарий или напиши 'нет', чтобы пропустить."
      );
      return;
    }

    if (pending === "workoutComment") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutResult");
        await ctx.reply("Опиши результат тренировки.");
        return;
      }

      const draft = getWorkoutDraft(chatId);
      if (!draft.planEntryId || !draft.startTime || !draft.resultText) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Сначала выбери тренировку.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      const comment =
        text.trim().toLowerCase() === "нет" ? null : text.trim();

      await upsertWorkoutReport({
        userId,
        planEntryId: draft.planEntryId,
        date: draft.date ?? formatDateLocal(new Date()),
        startTime: draft.startTime,
        resultText: draft.resultText,
        commentText: comment,
      });

      clearPendingInput(chatId);
      clearWeightDraft(chatId);
      clearWorkoutDraft(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply("Отчет сохранен.", {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (pending === "workoutEditTime") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutEditSelect");
        await ctx.reply("Выбери, что нужно отредактировать.", {
          reply_markup: buildWorkoutEditReplyKeyboard(),
        });
        return;
      }

      if (!TIME_REGEX.test(text)) {
        await ctx.reply(
          "Введите время начала в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      const draft = getWorkoutDraft(chatId);
      if (!draft.planEntryId) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Сначала выбери тренировку.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      const existingReport = await getWorkoutReportByPlanEntry({
        userId,
        planEntryId: draft.planEntryId,
      });
      if (!existingReport) {
        setPendingInput(chatId, "workoutStartTime");
        await ctx.reply(
          "Отчет не найден, начнем заново. Введите время начала тренировки."
        );
        return;
      }

      await upsertWorkoutReport({
        userId,
        planEntryId: draft.planEntryId,
        date: existingReport.date,
        startTime: text,
        resultText: existingReport.resultText,
        commentText: existingReport.commentText,
      });

      setPendingInput(chatId, "workoutEditSelect");
      await ctx.reply("Время обновлено. Что еще отредактировать?", {
        reply_markup: buildWorkoutEditReplyKeyboard(),
      });
      return;
    }

    if (pending === "workoutEditResult") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutEditSelect");
        await ctx.reply("Выбери, что нужно отредактировать.", {
          reply_markup: buildWorkoutEditReplyKeyboard(),
        });
        return;
      }

      const draft = getWorkoutDraft(chatId);
      if (!draft.planEntryId) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Сначала выбери тренировку.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      const existingReport = await getWorkoutReportByPlanEntry({
        userId,
        planEntryId: draft.planEntryId,
      });
      if (!existingReport) {
        setPendingInput(chatId, "workoutStartTime");
        await ctx.reply(
          "Отчет не найден, начнем заново. Введите время начала тренировки."
        );
        return;
      }

      await upsertWorkoutReport({
        userId,
        planEntryId: draft.planEntryId,
        date: existingReport.date,
        startTime: existingReport.startTime,
        resultText: text,
        commentText: existingReport.commentText,
      });

      setPendingInput(chatId, "workoutEditSelect");
      await ctx.reply("Результат обновлен. Что еще отредактировать?", {
        reply_markup: buildWorkoutEditReplyKeyboard(),
      });
      return;
    }

    if (pending === "workoutEditComment") {
      if (text === DATE_BACK_BUTTON_TEXT) {
        setPendingInput(chatId, "workoutEditSelect");
        await ctx.reply("Выбери, что нужно отредактировать.", {
          reply_markup: buildWorkoutEditReplyKeyboard(),
        });
        return;
      }

      const draft = getWorkoutDraft(chatId);
      if (!draft.planEntryId) {
        clearWorkoutDraft(chatId);
        setPendingInput(chatId, "workoutSelect");
        await ctx.reply("Сначала выбери тренировку.", {
          reply_markup: buildWeightActionReplyKeyboard(),
        });
        return;
      }

      const existingReport = await getWorkoutReportByPlanEntry({
        userId,
        planEntryId: draft.planEntryId,
      });
      if (!existingReport) {
        setPendingInput(chatId, "workoutStartTime");
        await ctx.reply(
          "Отчет не найден, начнем заново. Введите время начала тренировки."
        );
        return;
      }

      const comment =
        text.trim().toLowerCase() === "нет" ? null : text.trim();

      await upsertWorkoutReport({
        userId,
        planEntryId: draft.planEntryId,
        date: existingReport.date,
        startTime: existingReport.startTime,
        resultText: existingReport.resultText,
        commentText: comment,
      });

      setPendingInput(chatId, "workoutEditSelect");
      await ctx.reply("Комментарий обновлен. Что еще отредактировать?", {
        reply_markup: buildWorkoutEditReplyKeyboard(),
      });
      return;
    }
    if (pending === "timezone") {
      if (!isValidTimeZone(text)) {
        await ctx.reply(
          "Неверная таймзона. Пример: Europe/Moscow. Или напишите 'отмена'."
        );
        return;
      }

      await upsertSubscription({
        userId,
        chatId,
        patch: { timezone: text },
      });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(`Таймзона обновлена: ${text}.`, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
    }
  });
};
