import { unlinkAccount } from "@/bot/services/telegramAccounts";
import { buildLinkReplyKeyboard } from "@/bot/menu/menuKeyboard";

type UnlinkMenuActionArgs = {
  ctx: any;
  chatId: number;
};

export const handleUnlinkMenuAction = async ({ ctx, chatId }: UnlinkMenuActionArgs) => {
  await unlinkAccount(chatId);
  await ctx.reply("Связка удалена. Теперь можно привязать другой аккаунт.", {
    reply_markup: buildLinkReplyKeyboard(),
  });
};
