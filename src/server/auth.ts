import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, verificationTokens } from "@/server/db/schema";

export async function getUserByEmail(email: string) {
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  return existingUser ?? null;
}

export async function updateUserPasswordById(userId: number, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function markEmailVerifiedById(userId: number): Promise<void> {
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
}

export async function deleteVerificationTokenById(tokenId: number): Promise<void> {
  await db.delete(verificationTokens).where(eq(verificationTokens.id, tokenId));
}
