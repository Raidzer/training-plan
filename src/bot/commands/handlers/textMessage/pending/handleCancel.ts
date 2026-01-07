import type { PendingInput } from "@/bot/menu/menuState";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  CANCEL_LINK_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearRecoveryDraft,
  clearWeightDraft,
} from "@/bot/menu/menuState";

type CancelHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending: PendingInput;
};

export const handleCancelIfRequested = async ({
  ctx,
  chatId,
  text,
  pending,
}: CancelHandlerArgs) => {
  const lower = text.toLowerCase();
  if (
    lower === "отмена" ||
    lower === "cancel" ||
    lower === "/cancel" ||
    text === CANCEL_LINK_BUTTON_TEXT
  ) {
    clearPendingInput(chatId);
    clearRecoveryDraft(chatId);
    clearWeightDraft(chatId);
    const userId = await ensureLinked(chatId);
    const subscription = userId ? await getSubscription(userId) : null;
    const replyMarkup =
      pending === "link" || !userId
        ? buildLinkReplyKeyboard()
        : buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          });
    await ctx.reply("Ввод отменен.", { reply_markup: replyMarkup });
    return true;
  }

  return false;
};
