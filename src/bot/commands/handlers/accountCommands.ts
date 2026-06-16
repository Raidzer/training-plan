import type { Bot } from "grammy";
import { ensureLinked, getLinkedAccount, unlinkAccount } from "@/bot/services/telegramAccounts";
import { getSubscription } from "@/bot/services/telegramSubscriptions";
import { linkAccount } from "@/bot/services/telegramLinking";
import {
  buildCancelLinkReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import { setPendingInput } from "@/bot/menu/menuState";
import { resetPendingInput } from "@/bot/commands/handlers/helpers";

const START_LINK_PAYLOAD_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

const getStartPayload = (ctx: any) => {
  if (typeof ctx.match !== "string") {
    return "";
  }

  return ctx.match.trim();
};

const replyWithMainMenu = async (ctx: any, chatId: number, message: string) => {
  const userId = await ensureLinked(chatId);
  const subscription = userId ? await getSubscription(userId) : null;
  const keyboard = buildMainMenuReplyKeyboard({
    subscribed: subscription?.enabled ?? false,
  });

  return ctx.reply(message, {
    reply_markup: keyboard,
  });
};

const handleStartLinkPayload = async (ctx: any, payload: string) => {
  if (!START_LINK_PAYLOAD_REGEX.test(payload)) {
    return ctx.reply(
      "Ссылка для привязки недействительна или истекла. Получите новую ссылку на сайте.",
      {
        reply_markup: buildLinkReplyKeyboard(),
      }
    );
  }

  const result = await linkAccount({
    chatId: ctx.chat.id,
    code: payload,
    username: ctx.from?.username ?? null,
    firstName: ctx.from?.first_name ?? null,
  });

  if (!result.ok) {
    if (result.error === "чат-уже-связан") {
      const userId = await ensureLinked(ctx.chat.id);
      const subscription = userId ? await getSubscription(userId) : null;
      const keyboard = userId
        ? buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          })
        : buildLinkReplyKeyboard();
      return ctx.reply("Этот чат уже связан с аккаунтом.", {
        reply_markup: keyboard,
      });
    }
    if (result.error === "пользователь-уже-связан") {
      return ctx.reply("Аккаунт уже связан с Telegram.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
    }
    return ctx.reply(
      "Ссылка для привязки недействительна или истекла. Получите новую ссылку на сайте.",
      {
        reply_markup: buildLinkReplyKeyboard(),
      }
    );
  }

  return replyWithMainMenu(ctx, ctx.chat.id, "Аккаунт успешно связан. Меню управления ниже.");
};

export const registerAccountCommands = (bot: Bot) => {
  bot.command("start", async (ctx: any) => {
    if (ctx.chat?.type !== "private") {
      return ctx.reply("Напишите мне в личные сообщения.");
    }

    resetPendingInput(ctx);

    const startPayload = getStartPayload(ctx);
    if (startPayload) {
      return handleStartLinkPayload(ctx, startPayload);
    }

    const userId = await ensureLinked(ctx.chat.id);
    const subscription = userId ? await getSubscription(userId) : null;
    const message = userId
      ? "Привет! Меню управления ниже."
      : "Привет! Чтобы связать аккаунт, получи код на сайте и нажми кнопку ниже.";

    if (!userId) {
      const keyboard = buildLinkReplyKeyboard();
      return ctx.reply(message, { reply_markup: keyboard });
    }

    const keyboard = buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    });

    return ctx.reply(message, { reply_markup: keyboard });
  });

  bot.command("menu", async (ctx: any) => {
    if (ctx.chat?.type !== "private") {
      return ctx.reply("Напишите мне в личные сообщения.");
    }

    resetPendingInput(ctx);

    const userId = await ensureLinked(ctx.chat.id);
    const subscription = userId ? await getSubscription(userId) : null;
    const message = userId
      ? "Меню управления:"
      : "Меню управления доступно после связки. Получи код на сайте и нажми кнопку ниже.";

    if (!userId) {
      const keyboard = buildLinkReplyKeyboard();
      return ctx.reply(message, { reply_markup: keyboard });
    }

    const keyboard = buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    });

    return ctx.reply(message, { reply_markup: keyboard });
  });

  bot.command("link", async (ctx: any) => {
    if (ctx.chat?.type !== "private") {
      return ctx.reply("Связка доступна только в личных сообщениях.");
    }

    resetPendingInput(ctx);

    const text = ctx.message?.text ?? "";
    const parts = text.trim().split(/\s+/);
    const code = parts[1];

    if (!code || !/^\d{6}$/.test(code)) {
      setPendingInput(ctx.chat.id, "link");
      return ctx.reply("Введите 6-значный код с сайта.", {
        reply_markup: buildCancelLinkReplyKeyboard(),
      });
    }

    const result = await linkAccount({
      chatId: ctx.chat.id,
      code,
      username: ctx.from?.username ?? null,
      firstName: ctx.from?.first_name ?? null,
    });

    if (!result.ok) {
      if (result.error === "чат-уже-связан") {
        const userId = await ensureLinked(ctx.chat.id);
        const subscription = userId ? await getSubscription(userId) : null;
        const keyboard = userId
          ? buildMainMenuReplyKeyboard({
              subscribed: subscription?.enabled ?? false,
            })
          : buildLinkReplyKeyboard();
        return ctx.reply("Этот чат уже связан с аккаунтом.", {
          reply_markup: keyboard,
        });
      }
      if (result.error === "пользователь-уже-связан") {
        return ctx.reply("Аккаунт уже связан с Telegram.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
      }
      return ctx.reply("Код недействителен или истек.", {
        reply_markup: buildLinkReplyKeyboard(),
      });
    }

    const userId = await ensureLinked(ctx.chat.id);
    const subscription = userId ? await getSubscription(userId) : null;
    const keyboard = buildMainMenuReplyKeyboard({
      subscribed: subscription?.enabled ?? false,
    });

    return ctx.reply("Аккаунт успешно связан. Меню управления ниже.", {
      reply_markup: keyboard,
    });
  });

  bot.command("unlink", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
    const chatId = ctx.chat.id;
    const account = await getLinkedAccount(chatId);
    if (!account) {
      return ctx.reply("Этот чат не связан с аккаунтом.");
    }

    await unlinkAccount(chatId);
    return ctx.reply("Связка удалена. Теперь можно привязать другой аккаунт.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
  });
};
