import type { PendingInput } from "@/bot/menu/menuState";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { clearPendingInput } from "@/bot/menu/menuState";
import { handleCancelIfRequested } from "@/bot/commands/handlers/textMessage/pending/handleCancel";
import { handleDatePending } from "@/bot/commands/handlers/textMessage/pending/handleDate";
import { handleLinkPending } from "@/bot/commands/handlers/textMessage/pending/handleLink";
import { handleRecoveryPending } from "@/bot/commands/handlers/textMessage/pending/handleRecovery";
import { handleSchedulePending } from "@/bot/commands/handlers/textMessage/pending/handleSchedule";
import { handleWeightPending } from "@/bot/commands/handlers/textMessage/pending/handleWeight";

type PendingInputHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
  pending: PendingInput;
};

export const handlePendingInput = async ({
  ctx,
  chatId,
  text,
  pending,
}: PendingInputHandlerArgs) => {
  const canceled = await handleCancelIfRequested({
    ctx,
    chatId,
    text,
    pending,
  });
  if (canceled) {
    return;
  }

  if (pending === "link") {
    await handleLinkPending({ ctx, chatId, text });
    return;
  }

  const userId = await ensureLinked(chatId);
  if (!userId) {
    clearPendingInput(chatId);
    await ctx.reply("Сначала свяжите аккаунт командой /link.");
    return;
  }

  switch (pending) {
    case "dateMenu":
    case "date":
      await handleDatePending({ ctx, chatId, text, pending, userId });
      return;
    case "weightDateMenu":
    case "weightDate":
    case "weightAction":
    case "weightPeriod":
    case "weightValue":
      await handleWeightPending({ ctx, chatId, text, pending, userId });
      return;
    case "recoverySelect":
    case "recoverySleep":
      await handleRecoveryPending({ ctx, chatId, text, pending, userId });
      return;
    case "time":
    case "timezone":
      await handleSchedulePending({ ctx, chatId, text, pending, userId });
      return;
    default:
      return;
  }
};
