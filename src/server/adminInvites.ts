import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { registrationInvites, users } from "@/server/db/schema";

export type RegistrationInviteRow = {
  id: number;
  role: string;
  createdByUserId: number;
  usedByUserId: number | null;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
};

export async function getRegistrationInvites(limit: number): Promise<RegistrationInviteRow[]> {
  return await db
    .select({
      id: registrationInvites.id,
      role: registrationInvites.role,
      createdByUserId: registrationInvites.createdByUserId,
      usedByUserId: registrationInvites.usedByUserId,
      createdAt: registrationInvites.createdAt,
      expiresAt: registrationInvites.expiresAt,
      usedAt: registrationInvites.usedAt,
    })
    .from(registrationInvites)
    .orderBy(desc(registrationInvites.createdAt))
    .limit(limit);
}

export async function getUsersByIds(userIds: number[]): Promise<UserSummary[]> {
  if (userIds.length === 0) {
    return [];
  }

  return await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, userIds));
}

export async function createRegistrationInvite(params: {
  tokenHash: string;
  role: string;
  createdByUserId: number;
  expiresAt: Date;
}): Promise<{ id: number; role: string; createdAt: Date; expiresAt: Date } | null> {
  const [created] = await db
    .insert(registrationInvites)
    .values({
      tokenHash: params.tokenHash,
      role: params.role,
      createdByUserId: params.createdByUserId,
      expiresAt: params.expiresAt,
    })
    .returning({
      id: registrationInvites.id,
      role: registrationInvites.role,
      createdAt: registrationInvites.createdAt,
      expiresAt: registrationInvites.expiresAt,
    });

  if (!created) {
    return null;
  }

  return created;
}

export async function getUserSummaryById(userId: number): Promise<UserSummary | null> {
  const [userRow] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!userRow) {
    return null;
  }

  return userRow;
}
