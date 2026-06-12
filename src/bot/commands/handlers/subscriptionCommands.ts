import type { Bot } from "grammy";
import { TIME_REGEX } from "@/bot/utils/validators";
import { resolveTimeZoneInput } from "@/bot/utils/dateTime";
import { ensureLinked } from "@/bot/services/telegramAccounts";
import { getSubscription, upsertSubscription } from "@/bot/services/telegramSubscriptions";
import {
  buildMainMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  buildTimeReplyKeyboard,
  buildTimezoneReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";
import { resetPendingInput } from "@/bot/commands/handlers/helpers";

export const registerSubscriptionCommands = (bot: Bot) => {
  bot.command("subscribe", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { enabled: true },
    });

    const subscription = await getSubscription(userId);
    if (!subscription?.timezone || !subscription.sendTime) {
      return ctx.reply(
        "Подписка включена, но нужно задать часовой пояс и время рассылки в меню ниже.",
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
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
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
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const time = parts[1];

    if (!time || !TIME_REGEX.test(time)) {
      setPendingInput(ctx.chat.id, "time");
      return ctx.reply("Выберите время кнопкой или напишите новое в формате HH:MM.", {
        reply_markup: buildTimeReplyKeyboard(),
      });
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { sendTime: time },
    });

    const subscription = await getSubscription(userId);
    return ctx.reply(`Время рассылки обновлено: ${time}.`, {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
  });

  bot.command("timezone", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт кнопкой ниже.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const timeZone = parts[1];

    if (!timeZone) {
      const subscription = await getSubscription(userId);
      const currentTimeZone = subscription?.timezone ?? "не задана";
      setPendingInput(ctx.chat.id, "timezone");
      return ctx.reply(
        `Текущая таймзона: ${currentTimeZone}. Выберите таймзону кнопкой или напишите новую IANA/смещение, например Europe/Moscow или +3.`,
        {
          reply_markup: buildTimezoneReplyKeyboard({
            currentTimeZone: subscription?.timezone ?? null,
          }),
        }
      );
    }

    const resolved = resolveTimeZoneInput(timeZone);
    if (!resolved) {
      const subscription = await getSubscription(userId);
      setPendingInput(ctx.chat.id, "timezone");
      return ctx.reply("Неверная таймзона. Выберите вариант кнопкой или напишите IANA/смещение.", {
        reply_markup: buildTimezoneReplyKeyboard({
          currentTimeZone: subscription?.timezone ?? null,
        }),
      });
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
    const subscription = await getSubscription(userId);
    return ctx.reply(`Таймзона обновлена: ${displayTimeZone}.`, {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
  });
};
