import { createLinkCode } from "@/lib/alice";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

type LinkActionHandlerArgs = {
  ctx: any;
  userId: number;
};

export const handleAliceLinkAction = async ({ ctx, userId }: LinkActionHandlerArgs) => {
  const code = await createLinkCode(userId);

  await ctx.reply(
    `Ваш код для привязки Алисы: \`${code}\`\n\n` +
      `Скажите Алисе: "Связать аккаунт" и продиктуйте этот код.\n` +
      `Код действителен 5 минут.`,
    {
      parse_mode: "Markdown",
      ...buildMainMenuReplyKeyboard({ subscribed: true }),
    }
  );
};
