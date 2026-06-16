import { createHash, randomBytes, randomInt } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { telegramLinkCodes } from "@/server/db/schema";

const LINK_CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const TELEGRAM_DEEP_LINK_PAYLOAD_BYTES = 32;
const TELEGRAM_BOT_USERNAME_REGEX = /^[A-Za-z0-9_]{5,32}$/;

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);

const getLinkSecret = () => process.env.TELEGRAM_LINK_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

export const generateTelegramLinkCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export const generateTelegramLinkToken = () =>
  randomBytes(TELEGRAM_DEEP_LINK_PAYLOAD_BYTES).toString("base64url");

export const hashTelegramLinkCode = (code: string) =>
  createHash("sha256").update(`${code}:${getLinkSecret()}`).digest("hex");

export const normalizeTelegramBotUsername = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const username = value.trim().replace(/^@/, "");
  if (!TELEGRAM_BOT_USERNAME_REGEX.test(username)) {
    return null;
  }

  return username;
};

export const buildTelegramDeepLinkUrl = (params: {
  username: string | null | undefined;
  payload: string;
}) => {
  const username = normalizeTelegramBotUsername(params.username);
  if (!username) {
    return null;
  }

  return `https://t.me/${username}?start=${params.payload}`;
};

export type TelegramLinkIssueResult = {
  code: string;
  linkToken: string;
  expiresAt: Date;
};

const createUniqueLinkSecret = async (params: {
  now: Date;
  generateSecret: () => string;
  errorMessage: string;
}) => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const secret = params.generateSecret();
    const codeHash = hashTelegramLinkCode(secret);

    const [existing] = await db
      .select({ id: telegramLinkCodes.id })
      .from(telegramLinkCodes)
      .where(
        and(
          eq(telegramLinkCodes.codeHash, codeHash),
          isNull(telegramLinkCodes.consumedAt),
          gt(telegramLinkCodes.expiresAt, params.now)
        )
      )
      .limit(1);

    if (!existing) {
      return {
        secret,
        codeHash,
      };
    }
  }

  throw new Error(params.errorMessage);
};

export const issueTelegramLinkCode = async (params: {
  userId: number;
}): Promise<TelegramLinkIssueResult> => {
  const now = new Date();
  const expiresAt = addMinutes(now, LINK_CODE_TTL_MINUTES);

  await db.delete(telegramLinkCodes).where(eq(telegramLinkCodes.userId, params.userId));

  const code = await createUniqueLinkSecret({
    now,
    generateSecret: generateTelegramLinkCode,
    errorMessage: "Failed to issue telegram link code",
  });
  const linkToken = await createUniqueLinkSecret({
    now,
    generateSecret: generateTelegramLinkToken,
    errorMessage: "Failed to issue telegram link token",
  });

  await db.insert(telegramLinkCodes).values({
    userId: params.userId,
    codeHash: code.codeHash,
    expiresAt,
    consumedAt: null,
  });
  await db.insert(telegramLinkCodes).values({
    userId: params.userId,
    codeHash: linkToken.codeHash,
    expiresAt,
    consumedAt: null,
  });

  return { code: code.secret, linkToken: linkToken.secret, expiresAt };
};
