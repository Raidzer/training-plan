import { ensureLinked } from "@/bot/services/telegramAccounts";
import { buildLinkReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { handleHelpMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleHelpAction";
import { handleLinkMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleLinkAction";
import { handlePlanMenuAction } from "@/bot/commands/handlers/textMessage/menu/handlePlanAction";
import { handleScheduleMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleScheduleAction";
import { handleSubscriptionMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleSubscriptionAction";
import { handleUnlinkMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleUnlinkAction";
import { handleWeightMenuAction } from "@/bot/commands/handlers/textMessage/menu/handleWeightAction";
import { handleAliceLinkAction } from "@/bot/commands/handlers/textMessage/menu/handleAliceLinkAction";

type MenuActionHandlerArgs = {
  ctx: any;
  chatId: number;
  action: string;
};

export const handleMenuAction = async ({ ctx, chatId, action }: MenuActionHandlerArgs) => {
  if (action === "cancelLink" || action === "link") {
    await handleLinkMenuAction({ ctx, chatId, action });
    return;
  }

  const userId = await ensureLinked(chatId);
  if (!userId) {
    await ctx.reply("Сначала свяжите аккаунт командой /link.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    return;
  }

  switch (action) {
    case "today":
    case "date":
    case "dailyReport":
      await handlePlanMenuAction({ ctx, chatId, userId, action });
      return;
    case "weight":
      await handleWeightMenuAction({ ctx, chatId });
      return;
    case "time":
    case "timezone":
      await handleScheduleMenuAction({ ctx, chatId, action, userId });
      return;
    case "subscribe":
    case "unsubscribe":
      await handleSubscriptionMenuAction({ ctx, chatId, userId, action });
      return;
    case "unlink":
      await handleUnlinkMenuAction({ ctx, chatId });
      return;
    case "help":
      await handleHelpMenuAction({ ctx, userId });
      return;
    case "aliceLink":
      await handleAliceLinkAction({ ctx, userId });
      return;
    default:
      return;
  }
};
