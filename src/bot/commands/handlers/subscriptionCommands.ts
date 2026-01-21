import type { Bot } from "grammy";
import { TIME_REGEX } from "@/bot/utils/validators";
import { resolveTimeZoneInput } from "@/bot/utils/dateTime";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription, upsertSubscription } from "@/bot/services/telegramSubscriptions";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { resetPendingInput } from "@/bot/commands/handlers/helpers";

export const registerSubscriptionCommands = (bot: Bot) => {
  bot.command("subscribe", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { enabled: true },
    });

    const subscription = await getSubscription(userId);
    if (!subscription?.timezone || !subscription.sendTime) {
      return ctx.reply(
        "Подписка включена, но нужно задать /timezone и /time, чтобы получать рассылку.",
        {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        }
      );
    }

    return ctx.reply("Подписка включена.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
  });

  bot.command("unsubscribe", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { enabled: false },
    });

    const subscription = await getSubscription(userId);
    return ctx.reply("Подписка выключена.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
  });

  bot.command("time", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const time = parts[1];

    if (!time || !TIME_REGEX.test(time)) {
      return ctx.reply("Используй: /time 07:30");
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { sendTime: time },
    });

    return ctx.reply(`Время рассылки обновлено: ${time}.`);
  });

  bot.command("timezone", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const timeZone = parts[1];

    if (!timeZone) {
      const subscription = await getSubscription(userId);
      const currentTimeZone = subscription?.timezone ?? "не задана";
      return ctx.reply(
        `Текущая таймзона: ${currentTimeZone}. Используй: /timezone Europe/Moscow или /timezone +3`
      );
    }

    const resolved = resolveTimeZoneInput(timeZone);
    if (!resolved) {
      return ctx.reply("Неверная таймзона. Используй формат IANA или смещение (+3).");
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { timezone: resolved.timeZone },
    });

    const displayTimeZone =
      resolved.type === "offset"
        ? `${resolved.timeZone} (смещение ${resolved.offset >= 0 ? "+" : ""}${resolved.offset})`
        : resolved.timeZone;
    return ctx.reply(`Таймзона обновлена: ${displayTimeZone}.`);
  });
};
