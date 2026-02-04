import { v4 as uuidv4 } from "uuid";
import { db } from "@/db/client";
import { verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
    type: "reset-password",
  });

  return token;
};

export const getVerificationTokenByToken = async (token: string) => {
  const [verificationToken] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return verificationToken;
};
