import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { userAvatars } from "@/server/db/schema";

export async function getUserAvatarVersionById(userId: number): Promise<string | null> {
  const [avatar] = await db
    .select({ version: userAvatars.version })
    .from(userAvatars)
    .where(eq(userAvatars.userId, userId))
    .limit(1);

  return avatar?.version ?? null;
}

export async function getUserAvatarById(
  userId: number
): Promise<{ data: Buffer; version: string } | null> {
  const [avatar] = await db
    .select({ data: userAvatars.data, version: userAvatars.version })
    .from(userAvatars)
    .where(eq(userAvatars.userId, userId))
    .limit(1);

  return avatar ?? null;
}

export async function saveUserAvatar(userId: number, data: Buffer): Promise<string> {
  const version = randomUUID();
  await db
    .insert(userAvatars)
    .values({ userId, data, version })
    .onConflictDoUpdate({ target: userAvatars.userId, set: { data, version } });

  return version;
}

export async function deleteUserAvatarById(userId: number): Promise<void> {
  await db.delete(userAvatars).where(eq(userAvatars.userId, userId));
}
