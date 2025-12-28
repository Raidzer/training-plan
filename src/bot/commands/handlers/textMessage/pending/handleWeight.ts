import {
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  parseDisplayDate,
} from "@/bot/utils/dateTime";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildMainMenuReplyKeyboard,
  buildWeightActionReplyKeyboard,
  buildWeightDateReplyKeyboard,
  buildWeightPeriodReplyKeyboard,
  buildWorkoutSelectReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
  REPORT_MAIN_MENU_BUTTON_TEXT,
  REPORT_WEIGHT_BUTTON_TEXT,
  REPORT_WORKOUT_BUTTON_TEXT,
  WEIGHT_CUSTOM_DATE_BUTTON_TEXT,
  WEIGHT_EVENING_BUTTON_TEXT,
  WEIGHT_MORNING_BUTTON_TEXT,
  WEIGHT_TODAY_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearWeightDraft,
  clearWorkoutDraft,
  getWeightDraft,
  setPendingInput,
  setWeightDraft,
} from "@/bot/menu/menuState";
import { upsertWeightEntry } from "@/lib/weightEntries";
import { getPlanEntriesByDate } from "@/lib/planEntries";

type WeightHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending:
    | "weightDateMenu"
    | "weightDate"
    | "weightAction"
    | "weightPeriod"
    | "weightValue";
  userId: number;
};

export const handleWeightPending = async ({
  ctx,
  chatId,
  text,
  pending,
  userId,
}: WeightHandlerArgs) => {
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
      const periodLabel = period === "morning" ? "утренний" : "вечерний";
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

  if (text === DATE_BACK_BUTTON_TEXT) {
    setPendingInput(chatId, "weightPeriod");
    await ctx.reply("Выбери период взвешивания.", {
      reply_markup: buildWeightPeriodReplyKeyboard(),
    });
    return;
  }

  const normalized = text.replace(",", ".");
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)) {
    await ctx.reply("Введите вес в кг (например, 72.4) или напишите 'отмена'.");
    return;
  }

  const weightKg = Number(normalized);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    await ctx.reply("Введите вес в кг (например, 72.4) или напишите 'отмена'.");
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
};
