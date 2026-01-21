import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { telegramAccounts, telegramLinkCodes, telegramSubscriptions } from "@/db/schema";
import { hashTelegramLinkCode } from "@/lib/telegramLink";

export type LinkAccountResult =
  | { ok: true }
  | {
      ok: false;
      error: "код-недействителен" | "чат-уже-связан" | "пользователь-уже-связан";
    };

export const linkAccount = async (params: {
  chatId: number;
  code: string;
  username?: string | null;
  firstName?: string | null;
}): Promise<LinkAccountResult> => {
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
