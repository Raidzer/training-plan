import { getSubscription, upsertSubscription } from "@/bot/services/telegramSubscriptions";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

type SubscriptionMenuActionArgs = {
  ctx: any;
  chatId: number;
  userId: number;
  action: "subscribe" | "unsubscribe";
};

export const handleSubscriptionMenuAction = async ({
  ctx,
  chatId,
  userId,
  action,
}: SubscriptionMenuActionArgs) => {
  await upsertSubscription({
    userId,
    chatId,
    patch: { enabled: action === "subscribe" },
  });

  const subscription = await getSubscription(userId);
  if (action === "subscribe") {
    if (!subscription?.timezone || !subscription.sendTime) {
      await ctx.reply(
        "Подписка включена, но нужно задать часовой пояс и время рассылки в меню ниже.",
        {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        }
      );
      return;
    }
    await ctx.reply("Подписка включена.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
    return;
  }

  await ctx.reply("Подписка выключена.", {
    reply_markup: buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    }),
  });
};
