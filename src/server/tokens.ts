import { v4 as uuidv4 } from "uuid";
import { db } from "@/server/db/client";
import { users, verificationTokens } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const PASSWORD_RESET_COOLDOWN_MS = 15 * 60 * 1000;

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 24 * 3600 * 1000); // 24 hours

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
    type: "verify-email",
  });

  return token;
};

export const generatePasswordResetToken = async (email: string) => {
  return await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ id: users.id, passwordResetRequestedAt: users.passwordResetRequestedAt })
      .from(users)
      .where(eq(users.email, email))
      .for("update");

    if (!user) {
      return null;
    }

    const now = new Date();
    if (
      user.passwordResetRequestedAt &&
      now.getTime() - user.passwordResetRequestedAt.getTime() < PASSWORD_RESET_COOLDOWN_MS
    ) {
      return null;
    }

    const token = uuidv4();
    await tx
      .delete(verificationTokens)
      .where(
        and(eq(verificationTokens.identifier, email), eq(verificationTokens.type, "reset-password"))
      );
    await tx.update(users).set({ passwordResetRequestedAt: now }).where(eq(users.id, user.id));
    await tx.insert(verificationTokens).values({
      identifier: email,
      token,
      expires: new Date(now.getTime() + 3600 * 1000),
      type: "reset-password",
    });

    return token;
  });
};

export const getVerificationTokenByToken = async (token: string) => {
  const [verificationToken] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return verificationToken;
};

export const deleteVerificationTokensByIdentifierAndType = async (
  identifier: string,
  type: string
) => {
  await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.type, type)));
};
