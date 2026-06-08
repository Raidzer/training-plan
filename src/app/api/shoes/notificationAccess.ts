import { getTelegramAccountIdByUserId } from "@/server/telegram";

type NotificationAccessParams = {
  userId: number;
  emailVerified: Date | string | null | undefined;
  notifyOnLimitEmail: boolean | undefined;
  notifyOnLimitTelegram: boolean | undefined;
};

type NotificationAccessResult =
  | { valid: true }
  | {
      valid: false;
      error: "email_notifications_unavailable" | "telegram_notifications_unavailable";
    };

export async function validateShoeNotificationAccess(
  params: NotificationAccessParams
): Promise<NotificationAccessResult> {
  if (params.notifyOnLimitEmail === true && !params.emailVerified) {
    return { valid: false, error: "email_notifications_unavailable" };
  }

  if (params.notifyOnLimitTelegram === true) {
    const telegramAccountId = await getTelegramAccountIdByUserId(params.userId);
    if (!telegramAccountId) {
      return { valid: false, error: "telegram_notifications_unavailable" };
    }
  }

  return { valid: true };
}
