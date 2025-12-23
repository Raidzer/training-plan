import { createHash, randomInt } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { emailVerificationCodes } from "@/db/schema";
import { sendUnisenderEmail } from "@/lib/unisender";

const VERIFICATION_CODE_TTL_HOURS = 24;
const RESEND_DELAY_MINUTES = 30;

const addHours = (date: Date, hours: number) =>
  new Date(date.getTime() + hours * 60 * 60 * 1000);
const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);

export const generateEmailVerificationCode = () =>
  String(randomInt(0, 1_000_000)).padStart(6, "0");

const getVerificationSecret = () =>
  process.env.EMAIL_VERIFICATION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

export const hashEmailVerificationCode = (code: string, userId: number) =>
  createHash("sha256")
    .update(`${code}:${userId}:${getVerificationSecret()}`)
    .digest("hex");

export type EmailVerificationIssueResult =
  | { ok: true; nextResendAt: Date; expiresAt: Date }
  | { ok: false; retryAt: Date };

export const issueEmailVerificationCode = async (params: {
  userId: number;
  email: string;
  name?: string | null;
}): Promise<EmailVerificationIssueResult> => {
  const now = new Date();
  const [latest] = await db
    .select({
      nextResendAt: emailVerificationCodes.nextResendAt,
    })
    .from(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, params.userId))
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (latest?.nextResendAt && latest.nextResendAt > now) {
    return { ok: false, retryAt: latest.nextResendAt };
  }

  const code = generateEmailVerificationCode();
  const codeHash = hashEmailVerificationCode(code, params.userId);
  const expiresAt = addHours(now, VERIFICATION_CODE_TTL_HOURS);
  const nextResendAt = addMinutes(now, RESEND_DELAY_MINUTES);

  await db
    .delete(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, params.userId));
  await db.insert(emailVerificationCodes).values({
    userId: params.userId,
    codeHash,
    expiresAt,
    nextResendAt,
    consumedAt: null,
    createdAt: now,
  });

  try {
    await sendUnisenderEmail({
      toEmail: params.email,
      toName: params.name ?? null,
      subject: "Email verification",
      text: `Your verification code: ${code}. It is valid for 24 hours.`,
    });
  } catch (error) {
    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.userId, params.userId));
    throw error;
  }

  return { ok: true, nextResendAt, expiresAt };
};
