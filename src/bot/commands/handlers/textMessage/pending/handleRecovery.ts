import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildMainMenuReplyKeyboard,
  buildRecoveryReplyKeyboard,
  buildWeightActionReplyKeyboard,
  buildWeightDateReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
  RECOVERY_BATH_LABEL,
  RECOVERY_MASSAGE_LABEL,
  RECOVERY_MFR_LABEL,
  RECOVERY_SAVE_BUTTON_TEXT,
  RECOVERY_SLEEP_LABEL,
  REPORT_MAIN_MENU_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearRecoveryDraft,
  clearWeightDraft,
  getRecoveryDraft,
  setPendingInput,
  setRecoveryDraft,
} from "@/bot/menu/menuState";
import { upsertRecoveryEntry } from "@/server/recoveryEntries";
import { parseSleepTimeInput } from "@/bot/utils/sleepTime";

type RecoveryHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending: "recoverySelect" | "recoverySleep";
  userId: number;
};

const buildRecoveryKeyboard = (draft: {
  sleepHours: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
}) => {
  return buildRecoveryReplyKeyboard({
    sleepText: draft.sleepHours,
    hasBath: draft.hasBath,
    hasMfr: draft.hasMfr,
    hasMassage: draft.hasMassage,
  });
};

const replyWithRecoveryMenu = async (params: {
  ctx: any;
  message: string;
  draft: {
    sleepHours: string;
    hasBath: boolean;
    hasMfr: boolean;
    hasMassage: boolean;
  };
}) => {
  await params.ctx.reply(params.message, {
    reply_markup: buildRecoveryKeyboard(params.draft),
  });
};

export const handleRecoveryPending = async ({
  ctx,
  chatId,
  text,
  pending,
  userId,
}: RecoveryHandlerArgs) => {
  const trimmedText = text.trim();
  const lowerText = trimmedText.toLowerCase();
  const draft = getRecoveryDraft(chatId);

  if (pending === "recoverySelect") {
    if (trimmedText === DATE_BACK_BUTTON_TEXT) {
      clearRecoveryDraft(chatId);
      setPendingInput(chatId, "weightAction");
      await ctx.reply("Выбери действие.", {
        reply_markup: buildWeightActionReplyKeyboard(),
      });
      return;
    }

    if (trimmedText === REPORT_MAIN_MENU_BUTTON_TEXT) {
      clearPendingInput(chatId);
      clearRecoveryDraft(chatId);
      clearWeightDraft(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply("Меню управления ниже.", {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (!draft.date) {
      clearRecoveryDraft(chatId);
      clearWeightDraft(chatId);
      setPendingInput(chatId, "weightDateMenu");
      await ctx.reply("Сначала выбери дату.", {
        reply_markup: buildWeightDateReplyKeyboard(),
      });
      return;
    }

    if (trimmedText === RECOVERY_SAVE_BUTTON_TEXT) {
      const sleepTime = parseSleepTimeInput(draft.sleepHours);
      if (!sleepTime.valid) {
        await ctx.reply(
          "Введите время сна в формате ЧЧ:ММ (например, 07:30) или напишите 'нет', чтобы очистить."
        );
        return;
      }

      await upsertRecoveryEntry({
        userId,
        date: draft.date,
        hasBath: draft.hasBath,
        hasMfr: draft.hasMfr,
        hasMassage: draft.hasMassage,
        sleepHours: sleepTime.value,
      });

      clearPendingInput(chatId);
      clearRecoveryDraft(chatId);
      clearWeightDraft(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply("Отметки восстановления сохранены.", {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (trimmedText.startsWith(`${RECOVERY_SLEEP_LABEL}:`)) {
      setPendingInput(chatId, "recoverySleep");
      await ctx.reply(
        "Введите время сна в формате ЧЧ:ММ (например, 07:30) или напишите 'нет', чтобы очистить."
      );
      return;
    }

    if (trimmedText.startsWith(`${RECOVERY_MFR_LABEL}:`)) {
      const nextDraft = {
        ...draft,
        hasMfr: !draft.hasMfr,
      };
      setRecoveryDraft(chatId, { hasMfr: nextDraft.hasMfr });
      await replyWithRecoveryMenu({
        ctx,
        message: "Отметка обновлена. Можно выбрать еще или сохранить.",
        draft: nextDraft,
      });
      return;
    }

    if (trimmedText.startsWith(`${RECOVERY_MASSAGE_LABEL}:`)) {
      const nextDraft = {
        ...draft,
        hasMassage: !draft.hasMassage,
      };
      setRecoveryDraft(chatId, { hasMassage: nextDraft.hasMassage });
      await replyWithRecoveryMenu({
        ctx,
        message: "Отметка обновлена. Можно выбрать еще или сохранить.",
        draft: nextDraft,
      });
      return;
    }

    if (trimmedText.startsWith(`${RECOVERY_BATH_LABEL}:`)) {
      const nextDraft = {
        ...draft,
        hasBath: !draft.hasBath,
      };
      setRecoveryDraft(chatId, { hasBath: nextDraft.hasBath });
      await replyWithRecoveryMenu({
        ctx,
        message: "Отметка обновлена. Можно выбрать еще или сохранить.",
        draft: nextDraft,
      });
      return;
    }

    await replyWithRecoveryMenu({
      ctx,
      message: 'Выбери пункты восстановления или нажми "Сохранить".',
      draft,
    });
    return;
  }

  if (pending === "recoverySleep") {
    if (!draft.date) {
      clearRecoveryDraft(chatId);
      clearWeightDraft(chatId);
      setPendingInput(chatId, "weightDateMenu");
      await ctx.reply("Сначала выбери дату.", {
        reply_markup: buildWeightDateReplyKeyboard(),
      });
      return;
    }

    if (trimmedText === DATE_BACK_BUTTON_TEXT) {
      setPendingInput(chatId, "recoverySelect");
      await replyWithRecoveryMenu({
        ctx,
        message: 'Выбери пункты восстановления или нажми "Сохранить".',
        draft,
      });
      return;
    }

    if (trimmedText === REPORT_MAIN_MENU_BUTTON_TEXT) {
      clearPendingInput(chatId);
      clearRecoveryDraft(chatId);
      clearWeightDraft(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply("Меню управления ниже.", {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (lowerText === "нет") {
      setRecoveryDraft(chatId, { sleepHours: "" });
      setPendingInput(chatId, "recoverySelect");
      const updated = {
        ...draft,
        sleepHours: "",
      };
      await replyWithRecoveryMenu({
        ctx,
        message: "Сон очищен. Можно выбрать восстановление или сохранить.",
        draft: updated,
      });
      return;
    }

    const sleepTime = parseSleepTimeInput(trimmedText);
    if (!sleepTime.valid) {
      await ctx.reply(
        "Введите время сна в формате ЧЧ:ММ (например, 07:30) или напишите 'нет', чтобы очистить."
      );
      return;
    }

    setRecoveryDraft(chatId, { sleepHours: sleepTime.normalized });
    setPendingInput(chatId, "recoverySelect");
    const updated = {
      ...draft,
      sleepHours: sleepTime.normalized,
    };
    await replyWithRecoveryMenu({
      ctx,
      message: "Сон обновлен. Можно выбрать восстановление или сохранить.",
      draft: updated,
    });
  }
};
