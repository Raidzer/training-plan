import "dotenv/config";
import { Bot } from "grammy";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  telegramAccounts,
  telegramLinkCodes,
  telegramSubscriptions,
} from "@/db/schema";
import { getPlanEntriesByDate } from "@/lib/planEntries";
import { hashTelegramLinkCode } from "@/lib/telegramLink";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN не задан");
}

const bot = new Bot(token);

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DISPATCH_INTERVAL_MS = 30_000;

let dispatchRunning = false;

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateInTimeZone = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const getZonedDateTime = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  const minute = getPart("minute");

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Не удалось получить дату и время");
  }

  if (hour === "24") hour = "00";

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
};

const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const getLinkedAccount = async (chatId: number) => {
  const [account] = await db
    .select({ userId: telegramAccounts.userId })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.chatId, chatId));
  return account ?? null;
};

const unlinkAccount = async (chatId: number) => {
  return db.transaction(async (tx) => {
    const accounts = await tx
      .delete(telegramAccounts)
      .where(eq(telegramAccounts.chatId, chatId))
      .returning({ id: telegramAccounts.id });
    const subscriptions = await tx
      .delete(telegramSubscriptions)
      .where(eq(telegramSubscriptions.chatId, chatId))
      .returning({ id: telegramSubscriptions.id });

    return {
      accounts: accounts.length,
      subscriptions: subscriptions.length,
    };
  });
};

const getSubscription = async (userId: number) => {
  const [subscription] = await db
    .select({
      id: telegramSubscriptions.id,
      timezone: telegramSubscriptions.timezone,
      sendTime: telegramSubscriptions.sendTime,
      enabled: telegramSubscriptions.enabled,
    })
    .from(telegramSubscriptions)
    .where(eq(telegramSubscriptions.userId, userId));
  return subscription ?? null;
};

const upsertSubscription = async (params: {
  userId: number;
  chatId: number;
  patch: Partial<{
    timezone: string | null;
    sendTime: string | null;
    enabled: boolean;
  }>;
}) => {
  const now = new Date();
  const [existing] = await db
    .select({ id: telegramSubscriptions.id })
    .from(telegramSubscriptions)
    .where(eq(telegramSubscriptions.userId, params.userId));

  if (existing) {
    await db
      .update(telegramSubscriptions)
      .set({ ...params.patch, updatedAt: now })
      .where(eq(telegramSubscriptions.id, existing.id));
  } else {
    await db.insert(telegramSubscriptions).values({
      userId: params.userId,
      chatId: params.chatId,
      enabled: false,
      timezone: null,
      sendTime: null,
      ...params.patch,
      createdAt: now,
      updatedAt: now,
    });
  }
};

const ensureLinked = async (chatId: number) => {
  const account = await getLinkedAccount(chatId);
  return account?.userId ?? null;
};

const normalizeDateValue = (value: string | Date | null) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return formatDateLocal(value);
};

const linkAccount = async (params: {
  chatId: number;
  code: string;
  username?: string | null;
  firstName?: string | null;
}) => {
  const now = new Date();
  const codeHash = hashTelegramLinkCode(params.code);

  return db.transaction(async (tx) => {
    const [codeRow] = await tx
      .select({
        id: telegramLinkCodes.id,
        userId: telegramLinkCodes.userId,
        expiresAt: telegramLinkCodes.expiresAt,
        consumedAt: telegramLinkCodes.consumedAt,
      })
      .from(telegramLinkCodes)
      .where(
        and(
          eq(telegramLinkCodes.codeHash, codeHash),
          isNull(telegramLinkCodes.consumedAt),
          gt(telegramLinkCodes.expiresAt, now)
        )
      )
      .orderBy(asc(telegramLinkCodes.id))
      .limit(1);

    if (!codeRow) {
      return { ok: false, error: "код-недействителен" } as const;
    }

    const [existingChat] = await tx
      .select({ userId: telegramAccounts.userId })
      .from(telegramAccounts)
      .where(eq(telegramAccounts.chatId, params.chatId));
    if (existingChat) {
      return { ok: false, error: "чат-уже-связан" } as const;
    }

    const [existingUser] = await tx
      .select({ userId: telegramAccounts.userId })
      .from(telegramAccounts)
      .where(eq(telegramAccounts.userId, codeRow.userId));
    if (existingUser) {
      return { ok: false, error: "пользователь-уже-связан" } as const;
    }

    await tx.insert(telegramAccounts).values({
      userId: codeRow.userId,
      chatId: params.chatId,
      username: params.username ?? null,
      firstName: params.firstName ?? null,
      linkedAt: now,
    });

    const [subscription] = await tx
      .select({ id: telegramSubscriptions.id })
      .from(telegramSubscriptions)
      .where(eq(telegramSubscriptions.userId, codeRow.userId));

    if (subscription) {
      await tx
        .update(telegramSubscriptions)
        .set({ chatId: params.chatId, updatedAt: now })
        .where(eq(telegramSubscriptions.id, subscription.id));
    } else {
      await tx.insert(telegramSubscriptions).values({
        userId: codeRow.userId,
        chatId: params.chatId,
        enabled: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx
      .update(telegramLinkCodes)
      .set({ consumedAt: now })
      .where(eq(telegramLinkCodes.id, codeRow.id));

    return { ok: true } as const;
  });
};

const formatPlanMessage = (params: {
  date: string;
  entries: Awaited<ReturnType<typeof getPlanEntriesByDate>>;
}) => {
  if (!params.entries.length) {
    return `На ${params.date} нет тренировки.`;
  }

  const lines = params.entries.map((entry) => {
    const flags = entry.isWorkload ? "нагрузка" : "";
    const comment = entry.commentText
      ? `Комментарий: ${entry.commentText}`
      : "";
    const parts = [entry.taskText, flags].filter(Boolean).join(" ");
    return `${entry.sessionOrder}. ${parts}${comment ? `\n${comment}` : ""}`;
  });

  return [`План на ${params.date}:`, ...lines].join("\n");
};

const dispatchDueSubscriptions = async () => {
  if (dispatchRunning) return;
  dispatchRunning = true;

  try {
    const subscriptions = await db
      .select({
        id: telegramSubscriptions.id,
        userId: telegramSubscriptions.userId,
        chatId: telegramSubscriptions.chatId,
        timezone: telegramSubscriptions.timezone,
        sendTime: telegramSubscriptions.sendTime,
        lastSentOn: telegramSubscriptions.lastSentOn,
      })
      .from(telegramSubscriptions)
      .where(eq(telegramSubscriptions.enabled, true));

    if (!subscriptions.length) return;

    const now = new Date();

    for (const subscription of subscriptions) {
      if (!subscription.timezone || !subscription.sendTime) continue;

      let zoned;
      try {
        zoned = getZonedDateTime(now, subscription.timezone);
      } catch (error) {
        console.error("Ошибка таймзоны", subscription.timezone, error);
        continue;
      }

      if (zoned.time !== subscription.sendTime) continue;

      const lastSent = normalizeDateValue(subscription.lastSentOn);
      if (lastSent === zoned.date) continue;

      const entries = await getPlanEntriesByDate({
        userId: subscription.userId,
        date: zoned.date,
      });
      const message = formatPlanMessage({ date: zoned.date, entries });

      try {
        await bot.api.sendMessage(subscription.chatId, message);
        await db
          .update(telegramSubscriptions)
          .set({ lastSentOn: zoned.date, updatedAt: new Date() })
          .where(eq(telegramSubscriptions.id, subscription.id));
      } catch (error) {
        console.error("Ошибка рассылки", subscription.chatId, error);
      }
    }
  } finally {
    dispatchRunning = false;
  }
};

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

bot.catch((error: any) => {
  console.error("Ошибка Telegram-бота", error);
});

bot.start();
console.log("Telegram-бот запущен");

dispatchDueSubscriptions().catch((error) => {
  console.error("Ошибка старта рассылки", error);
});
setInterval(() => {
  dispatchDueSubscriptions().catch((error) => {
    console.error("Ошибка фоновой рассылки", error);
  });
}, DISPATCH_INTERVAL_MS);
