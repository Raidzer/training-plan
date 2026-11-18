import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, verificationTokens } from "@/server/db/schema";
import { passwordHashUpdate } from "@/server/services/users";

export async function getUserByEmail(email: string) {
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  return existingUser ?? null;
}

export async function resetUserPassword(
  userId: number,
  email: string,
  tokenId: number,
  passwordHash: string
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.email, email)))
      .for("update");
    if (!user) return false;

    const [token] = await tx
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.id, tokenId),
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "reset-password"),
          gt(verificationTokens.expires, new Date())
        )
      )
      .returning({ id: verificationTokens.id });
    if (!token) return false;

    await tx.update(users).set(passwordHashUpdate(passwordHash)).where(eq(users.id, userId));
    return true;
  });
}

export async function markEmailVerifiedById(userId: number): Promise<void> {
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
}

export async function deleteVerificationTokenById(tokenId: number): Promise<void> {
  await db.delete(verificationTokens).where(eq(verificationTokens.id, tokenId));
}
