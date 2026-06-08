import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { telegramAccounts, users } from "@/server/db/schema";
import type { WorkoutReportShoeLimitExceeded } from "@/server/workoutReports";

export type ShoeLimitNotificationTarget = {
  shoe: WorkoutReportShoeLimitExceeded;
  email: string | null;
  telegramChatId: number | null;
};

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
