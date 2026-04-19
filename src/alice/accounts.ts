import { addMinutes } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { aliceAccounts, aliceLinkCodes, users } from "@/server/db/schema";
import type { AliceLinkedUser } from "./types";

export async function createLinkCode(userId: number): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = addMinutes(new Date(), 5);

  await db.insert(aliceLinkCodes).values({
    userId,
    code,
    expiresAt,
  });

  return code;
}

export async function linkAliceAccount(aliceUserId: string, code: string): Promise<boolean> {
  const validLink = await db.query.aliceLinkCodes.findFirst({
    where: and(eq(aliceLinkCodes.code, code), gt(aliceLinkCodes.expiresAt, new Date())),
  });

  if (!validLink) {
    return false;
  }

  await db
    .insert(aliceAccounts)
    .values({
      userId: validLink.userId,
      aliceUserId,
    })
    .onConflictDoUpdate({
      target: aliceAccounts.aliceUserId,
      set: { userId: validLink.userId, linkedAt: new Date() },
    });

  await db.delete(aliceLinkCodes).where(eq(aliceLinkCodes.code, code));

  return true;
}

export async function getUserIdByAliceId(aliceUserId: string): Promise<AliceLinkedUser | null> {
  const result = await db
    .select({
      userId: aliceAccounts.userId,
      timezone: users.timezone,
    })
    .from(aliceAccounts)
    .innerJoin(users, eq(aliceAccounts.userId, users.id))
    .where(eq(aliceAccounts.aliceUserId, aliceUserId))
    .limit(1);

  return result[0] ?? null;
}
