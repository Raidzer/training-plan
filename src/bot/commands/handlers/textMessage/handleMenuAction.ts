import {
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  getNextIsoDates,
  getWeekdayShortRu,
} from "@/bot/utils/dateTime";
import { ensureLinked, unlinkAccount } from "@/bot/services/telegramAccounts";
import {
  getSubscription,
  upsertSubscription,
} from "@/bot/services/telegramSubscriptions";
import { formatPlanMessage } from "@/bot/messages/planMessage";
import {
  buildCancelLinkReplyKeyboard,
  buildDateMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  buildWeightDateReplyKeyboard,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearWeightDraft,
  clearWorkoutDraft,
  setPendingInput,
} from "@/bot/menu/menuState";
import { getPlanEntriesByDate } from "@/lib/planEntries";

type MenuActionHandlerArgs = {
  ctx: any;
  chatId: number;
  action: string;
};

export const handleMenuAction = async ({
  ctx,
  chatId,
  action,
}: MenuActionHandlerArgs) => {
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
      "Если передумали, нажмите кнопку <Отменить привязку>.",
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
    setPendingInput(chatId, "dateMenu");
    const subscription = await getSubscription(userId);
    const timeZone = subscription?.timezone ?? null;
    const today = timeZone
      ? formatDateInTimeZone(new Date(), timeZone)
      : formatDateLocal(new Date());
    const dateButtons = getNextIsoDates(today, 7).map((date) => {
      const weekday = getWeekdayShortRu(date);
      const label = formatDateForDisplay(date);
      return weekday ? `${label} (${weekday})` : label;
    });
    await ctx.reply(
      "Выбери дату из списка или нажми \"Произвольная дата\".",
      {
        reply_markup: buildDateMenuReplyKeyboard({ dateButtons }),
      }
    );
    return;
  }

  if (action === "weight") {
    clearWeightDraft(chatId);
    clearWorkoutDraft(chatId);
    setPendingInput(chatId, "weightDateMenu");
    await ctx.reply("Когда зафиксировать вес?", {
      reply_markup: buildWeightDateReplyKeyboard(),
    });
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
      " Сегодня - показать план на сегодня.",
      " Дата - запрос плана на конкретную дату.",
      " Заполнить отчет - записать вес или отчет по тренировке.",
      " Подписка - включить/выключить рассылку.",
      " Время рассылки - установить время.",
      " Таймзона - установить часовой пояс.",
      " Отвязать - удалить связь с аккаунтом.",
    ].join("\n");
    const subscription = await getSubscription(userId);
    await ctx.reply(helpMessage, {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: subscription?.enabled ?? false,
      }),
    });
    return;
  }
};
