import { createHash, randomInt } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { telegramLinkCodes } from "@/db/schema";

const LINK_CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);

const getLinkSecret = () => process.env.TELEGRAM_LINK_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

export const generateTelegramLinkCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export const hashTelegramLinkCode = (code: string) =>
  createHash("sha256").update(`${code}:${getLinkSecret()}`).digest("hex");

export type TelegramLinkIssueResult = {
  code: string;
  expiresAt: Date;
};

export const issueTelegramLinkCode = async (params: {
  userId: number;
}): Promise<TelegramLinkIssueResult> => {
  const now = new Date();

  await db.delete(telegramLinkCodes).where(eq(telegramLinkCodes.userId, params.userId));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = generateTelegramLinkCode();
    const codeHash = hashTelegramLinkCode(code);

    const [existing] = await db
      .select({ id: telegramLinkCodes.id })
      .from(telegramLinkCodes)
      .where(
        and(
          eq(telegramLinkCodes.codeHash, codeHash),
          isNull(telegramLinkCodes.consumedAt),
          gt(telegramLinkCodes.expiresAt, now)
        )
      )
      .limit(1);

    if (!existing) {
      const expiresAt = addMinutes(now, LINK_CODE_TTL_MINUTES);

      await db.insert(telegramLinkCodes).values({
        userId: params.userId,
        codeHash,
        expiresAt,
        consumedAt: null,
      });

      return { code, expiresAt };
    }
  }

  throw new Error("Failed to issue telegram link code");
};
