import type { Bot } from "grammy";
import { getMenuActionByText } from "@/bot/commands/handlers/helpers";
import { handleMenuAction } from "@/bot/commands/handlers/textMessage/handleMenuAction";
import { handlePendingInput } from "@/bot/commands/handlers/textMessage/handlePendingInput";
import { getPendingInput } from "@/bot/menu/menuState";

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
      await handleMenuAction({ ctx, chatId, action });
      return;
    }

    if (!pending) {
      return;
    }

    await handlePendingInput({ ctx, chatId, text, pending });
  });
};
