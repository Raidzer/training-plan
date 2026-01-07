import { TIME_REGEX } from "@/bot/utils/validators";
import { formatDateLocal } from "@/bot/utils/dateTime";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildMainMenuReplyKeyboard,
  buildWeightActionReplyKeyboard,
  buildWeightDateReplyKeyboard,
  buildWorkoutEditReplyKeyboard,
  buildWorkoutSelectReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
  REPORT_EDIT_COMMENT_BUTTON_TEXT,
  REPORT_EDIT_RESULT_BUTTON_TEXT,
  REPORT_EDIT_TIME_BUTTON_TEXT,
  REPORT_MAIN_MENU_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearRecoveryDraft,
  clearWeightDraft,
  clearWorkoutDraft,
  getWeightDraft,
  getWorkoutDraft,
  setPendingInput,
  setWorkoutDraft,
} from "@/bot/menu/menuState";
import { getPlanEntriesByDate } from "@/lib/planEntries";
import {
  getWorkoutReportByPlanEntry,
  upsertWorkoutReport,
} from "@/lib/workoutReports";

type WorkoutHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending:
    | "workoutSelect"
    | "workoutStartTime"
    | "workoutResult"
    | "workoutComment"
    | "workoutEditSelect"
    | "workoutEditTime"
    | "workoutEditResult"
    | "workoutEditComment";
  userId: number;
};

export const handleWorkoutPending = async ({
  ctx,
  chatId,
  text,
  pending,
  userId,
}: WorkoutHandlerArgs) => {
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
      clearRecoveryDraft(chatId);
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
      clearRecoveryDraft(chatId);
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

    const comment = text.trim().toLowerCase() === "нет" ? null : text.trim();

    await upsertWorkoutReport({
      userId,
      planEntryId: draft.planEntryId,
      date: draft.date ?? formatDateLocal(new Date()),
      startTime: draft.startTime,
      resultText: draft.resultText,
      commentText: comment,
    });

    clearPendingInput(chatId);
    clearRecoveryDraft(chatId);
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

  if (pending !== "workoutEditComment") {
    return;
  }

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

  const comment = text.trim().toLowerCase() === "нет" ? null : text.trim();

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
};
