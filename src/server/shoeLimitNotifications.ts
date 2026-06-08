import { eq } from "drizzle-orm";
import { sendShoeLimitEmail } from "@/server/email";
import { db } from "@/server/db/client";
import { telegramAccounts, users } from "@/server/db/schema";
import type { WorkoutReportShoeLimitExceeded } from "@/server/workoutReports";

export type ShoeLimitNotificationTarget = {
  shoe: WorkoutReportShoeLimitExceeded;
  email: string | null;
  telegramChatId: number | null;
};

export type ShoeLimitNotificationSummary = {
  targets: number;
  sent: number;
  failed: number;
};

const buildShoeLimitMessage = (shoe: WorkoutReportShoeLimitExceeded) =>
  [
    "Пора проверить беговую обувь.",
    `Пара "${shoe.name}" превысила заданный лимит пробега.`,
    `Текущий пробег: ${shoe.currentMileageKm} км.`,
    `Лимит: ${shoe.mileageLimitKm} км.`,
  ].join("\n");

async function sendTelegramShoeLimitMessage(params: {
  chatId: number;
  shoe: WorkoutReportShoeLimitExceeded;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: buildShoeLimitMessage(params.shoe),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Telegram shoe limit notification failed: ${response.status} ${details}`);
  }
}

export async function resolveShoeLimitNotificationTargets(params: {
  userId: number;
  shoes: WorkoutReportShoeLimitExceeded[];
}): Promise<ShoeLimitNotificationTarget[]> {
  if (params.shoes.length === 0) {
    return [];
  }

  const [user] = await db
    .select({
      email: users.email,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  if (!user) {
    return [];
  }

  const [telegramAccount] = await db
    .select({ chatId: telegramAccounts.chatId })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.userId, params.userId))
    .limit(1);

  return params.shoes.flatMap((shoe) => {
    const email = shoe.notifyOnLimitEmail && user.emailVerified ? user.email : null;
    const telegramChatId =
      shoe.notifyOnLimitTelegram && telegramAccount ? telegramAccount.chatId : null;

    if (!email && !telegramChatId) {
      return [];
    }

    return [
      {
        shoe,
        email,
        telegramChatId,
      },
    ];
  });
}

export async function sendShoeLimitNotifications(params: {
  userId: number;
  shoes: WorkoutReportShoeLimitExceeded[];
}): Promise<ShoeLimitNotificationSummary> {
  const targets = await resolveShoeLimitNotificationTargets(params);
  const sendTasks: Promise<void>[] = [];

  for (const target of targets) {
    if (target.email) {
      sendTasks.push(
        sendShoeLimitEmail({
          email: target.email,
          shoeName: target.shoe.name,
          currentMileageKm: target.shoe.currentMileageKm,
          mileageLimitKm: target.shoe.mileageLimitKm,
        })
      );
    }

    if (target.telegramChatId !== null) {
      sendTasks.push(
        sendTelegramShoeLimitMessage({
          chatId: target.telegramChatId,
          shoe: target.shoe,
        })
      );
    }
  }

  const results = await Promise.allSettled(sendTasks);
  return {
    targets: targets.length,
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}
