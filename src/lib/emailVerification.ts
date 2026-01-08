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

  let greeting = "Здравствуйте!";
  if (params.name) {
    greeting = `Здравствуйте, ${params.name}!`;
  }

  const subject = "Подтверждение почты в Training Plan";
  const text = `${greeting}

Ваш код подтверждения: ${code}
Код действует 24 часа.
Никому не сообщайте этот код.

Если вы не запрашивали подтверждение почты, просто проигнорируйте это письмо.

С уважением,
Training Plan`;
  const html = `<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #111827; line-height: 1.6;">
  <h2 style="margin: 0 0 12px; font-size: 20px;">Подтверждение почты</h2>
  <p style="margin: 0 0 12px;">${greeting}</p>
  <p style="margin: 0 0 12px;">Введите код подтверждения:</p>
  <div style="display: inline-block; padding: 10px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 24px; letter-spacing: 4px; font-weight: 700; background: #f9fafb;">
    ${code}
  </div>
  <p style="margin: 12px 0 12px;">Код действует 24 часа. Никому не сообщайте этот код.</p>
  <p style="margin: 0 0 12px; color: #6b7280;">Если вы не запрашивали подтверждение почты, просто проигнорируйте это письмо.</p>
  <p style="margin: 16px 0 0;">С уважением,<br/>Training Plan</p>
</div>`;

  try {
    await sendUnisenderEmail({
      toEmail: params.email,
      toName: params.name ?? null,
      subject,
      text,
      html,
    });
  } catch (error) {
    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.userId, params.userId));
    throw error;
  }

  return { ok: true, nextResendAt, expiresAt };
};
