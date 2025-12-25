import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { linkAccount } from "@/bot/services/telegramLinking";
import {
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput } from "@/bot/menu/menuState";

type LinkHandlerArgs = {
  ctx: any;
  chatId: number;
  text: string;
};

export const handleLinkPending = async ({
  ctx,
  chatId,
  text,
}: LinkHandlerArgs) => {
  if (!/^\d{6}$/.test(text)) {
    await ctx.reply("Введите 6-значный код с сайта или напишите 'отмена'.");
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
};
