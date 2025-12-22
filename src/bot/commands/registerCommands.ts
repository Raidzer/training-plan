import type { Bot } from "grammy";
import { DATE_REGEX, TIME_REGEX } from "@/bot/utils/validators";
import {
  formatDateInTimeZone,
  formatDateLocal,
  isValidTimeZone,
} from "@/bot/utils/dateTime";
import {
  ensureLinked,
  getLinkedAccount,
  unlinkAccount,
} from "@/bot/services/telegramAccounts";
import {
  getSubscription,
  upsertSubscription,
} from "@/bot/services/telegramSubscriptions";
import { linkAccount } from "@/bot/services/telegramLinking";
import { getPlanEntriesByDate } from "@/lib/planEntries";
import { formatPlanMessage } from "@/bot/messages/planMessage";

export const registerCommands = (bot: Bot) => {
  bot.command("start", async (ctx: any) => {
    if (ctx.chat?.type !== "private") {
      return ctx.reply("Напишите мне в личные сообщения.");
    }

    return ctx.reply(
      "Привет! Чтобы связать аккаунт, получи код на сайте и отправь команду /link <код>."
    );
  });

  bot.command("link", async (ctx: any) => {
    if (ctx.chat?.type !== "private") {
      return ctx.reply("Связка доступна только в личных сообщениях.");
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const code = parts[1];

    if (!code || !/^\d{6}$/.test(code)) {
      return ctx.reply("Используй: /link 123456");
    }

    const result = await linkAccount({
      chatId: ctx.chat.id,
      code,
      username: ctx.from?.username ?? null,
      firstName: ctx.from?.first_name ?? null,
    });

    if (!result.ok) {
      if (result.error === "чат-уже-связан") {
        return ctx.reply("Этот чат уже связан с аккаунтом.");
      }
      if (result.error === "пользователь-уже-связан") {
        return ctx.reply("Аккаунт уже связан с Telegram.");
      }
      return ctx.reply("Код недействителен или истек.");
    }

    return ctx.reply("Аккаунт успешно связан.");
  });

  bot.command("today", async (ctx: any) => {
    if (!ctx.chat) return;
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const subscription = await getSubscription(userId);
    const timeZone = subscription?.timezone ?? null;
    const today = timeZone
      ? formatDateInTimeZone(new Date(), timeZone)
      : formatDateLocal(new Date());

    const entries = await getPlanEntriesByDate({ userId, date: today });
    const message = formatPlanMessage({ date: today, entries });

    if (!timeZone) {
      return ctx.reply(
        `${message}\n\nТаймзона не задана, использую время сервера.`
      );
    }

    return ctx.reply(message);
  });

  bot.command("date", async (ctx: any) => {
    if (!ctx.chat) return;
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const date = parts[1];

    if (!date || !DATE_REGEX.test(date)) {
      return ctx.reply("Используй: /date 2025-12-21");
    }

    const entries = await getPlanEntriesByDate({ userId, date });
    const message = formatPlanMessage({ date, entries });

    return ctx.reply(message);
  });

  bot.command("subscribe", async (ctx: any) => {
    if (!ctx.chat) return;
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
        "Подписка включена, но нужно задать /timezone и /time, чтобы получать рассылку."
      );
    }

    return ctx.reply("Подписка включена.");
  });

  bot.command("unsubscribe", async (ctx: any) => {
    if (!ctx.chat) return;
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { enabled: false },
    });

    return ctx.reply("Подписка выключена.");
  });

  bot.command("unlink", async (ctx: any) => {
    if (!ctx.chat) return;
    const chatId = ctx.chat.id;
    const account = await getLinkedAccount(chatId);
    if (!account) {
      return ctx.reply("Этот чат не связан с аккаунтом.");
    }

    await unlinkAccount(chatId);
    return ctx.reply("Связка удалена. Теперь можно привязать другой аккаунт.");
  });

  bot.command("time", async (ctx: any) => {
    if (!ctx.chat) return;
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
    if (!ctx.chat) return;
    const userId = await ensureLinked(ctx.chat.id);
    if (!userId) {
      return ctx.reply("Сначала свяжите аккаунт командой /link.");
    }

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const timeZone = parts[1];

    if (!timeZone) {
      return ctx.reply("Используй: /timezone Europe/Moscow");
    }

    if (!isValidTimeZone(timeZone)) {
      return ctx.reply("Неверная таймзона. Используй формат IANA.");
    }

    await upsertSubscription({
      userId,
      chatId: ctx.chat.id,
      patch: { timezone: timeZone },
    });

    return ctx.reply(`Таймзона обновлена: ${timeZone}.`);
  });
};
