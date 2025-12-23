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
import {
  buildCancelLinkReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  CANCEL_LINK_BUTTON_TEXT,
  DATE_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  LINK_BUTTON_TEXT,
  SUBSCRIBE_OFF_BUTTON_TEXT,
  SUBSCRIBE_ON_BUTTON_TEXT,
  TIME_BUTTON_TEXT,
  TIMEZONE_BUTTON_TEXT,
  TODAY_BUTTON_TEXT,
  UNLINK_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  getPendingInput,
  setPendingInput,
} from "@/bot/menu/menuState";

export const registerCommands = (bot: Bot) => {
  const resetPendingInput = (ctx: any) => {
    if (ctx.chat) {
      clearPendingInput(ctx.chat.id);
    }
  };

  const getMenuActionByText = (text: string) => {
    switch (text) {
      case LINK_BUTTON_TEXT:
        return "link";
      case CANCEL_LINK_BUTTON_TEXT:
        return "cancelLink";
      case TODAY_BUTTON_TEXT:
        return "today";
      case DATE_BUTTON_TEXT:
        return "date";
      case SUBSCRIBE_ON_BUTTON_TEXT:
        return "unsubscribe";
      case SUBSCRIBE_OFF_BUTTON_TEXT:
        return "subscribe";
      case TIME_BUTTON_TEXT:
        return "time";
      case TIMEZONE_BUTTON_TEXT:
        return "timezone";
      case UNLINK_BUTTON_TEXT:
        return "unlink";
      case HELP_BUTTON_TEXT:
        return "help";
      default:
        return null;
    }
  };

  bot.command("start", async (ctx: any) => {
    if (ctx.chat?.type !== "private") {
      return ctx.reply("Напишите мне в личные сообщения.");
    }

    resetPendingInput(ctx);

    const userId = await ensureLinked(ctx.chat.id);
    const subscription = userId ? await getSubscription(userId) : null;
    const message = userId
      ? "Привет! Меню управления ниже."
      : "Привет! Чтобы связать аккаунт, получи код на сайте и отправь команду /link <код>.";

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
      : "Меню управления доступно после связки. Используй /link <код>.";

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
      return ctx.reply("Используй: /link 123456", {
        reply_markup: buildLinkReplyKeyboard(),
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

  bot.command("today", async (ctx: any) => {
    if (!ctx.chat) {
      return;
    }
    resetPendingInput(ctx);
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
    const date = parts[1];

    if (!date || !DATE_REGEX.test(date)) {
      return ctx.reply("Используй: /date 2025-12-21");
    }

    const entries = await getPlanEntriesByDate({ userId, date });
    const message = formatPlanMessage({ date, entries });

    return ctx.reply(message);
  });

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
      if (action === "cancelLink") {
        clearPendingInput(chatId);
        await ctx.reply("Привязка отменена.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
        return;
      }

      if (action === "link") {
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
        await ctx.reply(
          "Если передумали, нажмите кнопку «Отменить привязку».",
          { reply_markup: buildCancelLinkReplyKeyboard() }
        );
        return;
      }

      const userId = await ensureLinked(chatId);
      if (!userId) {
        await ctx.reply("Сначала свяжите аккаунт командой /link.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
        return;
      }

      if (action === "today") {
        const subscription = await getSubscription(userId);
        const timeZone = subscription?.timezone ?? null;
        const today = timeZone
          ? formatDateInTimeZone(new Date(), timeZone)
          : formatDateLocal(new Date());

        const entries = await getPlanEntriesByDate({ userId, date: today });
        const message = formatPlanMessage({ date: today, entries });

        if (!timeZone) {
          await ctx.reply(
            `${message}\n\nТаймзона не задана, использую время сервера.`,
            {
              reply_markup: buildMainMenuReplyKeyboard({
                subscribed: subscription?.enabled ?? false,
              }),
            }
          );
          return;
        }

        await ctx.reply(message, {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }

      if (action === "date") {
        setPendingInput(chatId, "date");
        await ctx.reply(
          "Введите дату в формате YYYY-MM-DD (например, 2025-12-21) или напишите 'отмена'."
        );
        return;
      }

      if (action === "time") {
        setPendingInput(chatId, "time");
        await ctx.reply(
          "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      if (action === "timezone") {
        setPendingInput(chatId, "timezone");
        await ctx.reply(
          "Введите таймзону IANA (например, Europe/Moscow) или напишите 'отмена'."
        );
        return;
      }

      if (action === "subscribe" || action === "unsubscribe") {
        await upsertSubscription({
          userId,
          chatId,
          patch: { enabled: action === "subscribe" },
        });

        const subscription = await getSubscription(userId);
        if (action === "subscribe") {
          if (!subscription?.timezone || !subscription.sendTime) {
            await ctx.reply(
              "Подписка включена, но нужно задать /timezone и /time, чтобы получать рассылку.",
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
        return;
      }

      if (action === "unlink") {
        await unlinkAccount(chatId);
        await ctx.reply("Связка удалена. Теперь можно привязать другой аккаунт.", {
          reply_markup: buildLinkReplyKeyboard(),
        });
        return;
      }

      if (action === "help") {
        const helpMessage = [
          "Что умеет бот:",
          "• Сегодня — показать план на сегодня.",
          "• Дата — запрос плана на конкретную дату.",
          "• Подписка — включить/выключить рассылку.",
          "• Время рассылки — установить время.",
          "• Таймзона — установить часовой пояс.",
          "• Отвязать — удалить связь с аккаунтом.",
        ].join("\n");
        const subscription = await getSubscription(userId);
        await ctx.reply(helpMessage, {
          reply_markup: buildMainMenuReplyKeyboard({
            subscribed: subscription?.enabled ?? false,
          }),
        });
        return;
      }
    }

    if (!pending) {
      return;
    }

    const lower = text.toLowerCase();
    if (
      lower === "отмена" ||
      lower === "cancel" ||
      lower === "/cancel" ||
      text === CANCEL_LINK_BUTTON_TEXT
    ) {
      clearPendingInput(chatId);
      const userId = await ensureLinked(chatId);
      const subscription = userId ? await getSubscription(userId) : null;
      const replyMarkup =
        pending === "link" || !userId
          ? buildLinkReplyKeyboard()
          : buildMainMenuReplyKeyboard({
              subscribed: subscription?.enabled ?? false,
            });
      await ctx.reply("Ввод отменен.", { reply_markup: replyMarkup });
      return;
    }

    if (pending === "link") {
      if (!/^\d{6}$/.test(text)) {
        await ctx.reply(
          "Введите 6-значный код с сайта или напишите 'отмена'."
        );
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
      return;
    }

    const userId = await ensureLinked(chatId);
    if (!userId) {
      clearPendingInput(chatId);
      await ctx.reply("Сначала свяжите аккаунт командой /link.");
      return;
    }

    if (pending === "date") {
      if (!DATE_REGEX.test(text)) {
        await ctx.reply(
          "Введите дату в формате YYYY-MM-DD (например, 2025-12-21) или напишите 'отмена'."
        );
        return;
      }

      const entries = await getPlanEntriesByDate({ userId, date: text });
      const message = formatPlanMessage({ date: text, entries });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(message, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (pending === "time") {
      if (!TIME_REGEX.test(text)) {
        await ctx.reply(
          "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
        );
        return;
      }

      await upsertSubscription({
        userId,
        chatId,
        patch: { sendTime: text },
      });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(`Время рассылки обновлено: ${text}.`, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
      return;
    }

    if (pending === "timezone") {
      if (!isValidTimeZone(text)) {
        await ctx.reply(
          "Неверная таймзона. Пример: Europe/Moscow. Или напишите 'отмена'."
        );
        return;
      }

      await upsertSubscription({
        userId,
        chatId,
        patch: { timezone: text },
      });

      clearPendingInput(chatId);
      const subscription = await getSubscription(userId);
      await ctx.reply(`Таймзона обновлена: ${text}.`, {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: subscription?.enabled ?? false,
        }),
      });
    }
  });
};
