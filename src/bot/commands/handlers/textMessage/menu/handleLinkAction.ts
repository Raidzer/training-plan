import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildCancelLinkReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, setPendingInput } from "@/bot/menu/menuState";

type LinkMenuActionArgs = {
  ctx: any;
  chatId: number;
  action: "cancelLink" | "link";
};

export const handleLinkMenuAction = async ({
  ctx,
  chatId,
  action,
}: LinkMenuActionArgs) => {
  if (action === "cancelLink") {
    clearPendingInput(chatId);
    await ctx.reply("Привязка отменена.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    return;
  }

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
  await ctx.reply("Если передумали, нажмите кнопку <Отменить привязку>.", {
    reply_markup: buildCancelLinkReplyKeyboard(),
  });
};
