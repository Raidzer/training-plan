import { eq, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

const USER_ACTIVITY_UPDATE_INTERVAL_MS = 15 * 60 * 1000;

export type UserProfileUpdateInput = {
  name: string;
  lastName: string | null;
  patronymic: string | null;
  heightCm: number | null;
  weeklyWorkloadCount: number | null;
  gender: string;
  dateOfBirth: string | null;
  occupation: string | null;
  miscellaneous: string | null;
  timezone: string;
};

export type UserActivitySnapshot = {
  id: number;
  lastActiveAt?: Date | null;
};

export async function getUserByIdentifier(identifier: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.login, identifier)))
    .limit(1);

  return user || null;
}

export async function getUserById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      lastName: users.lastName,
      patronymic: users.patronymic,
      heightCm: users.heightCm,
      weeklyWorkloadCount: users.weeklyWorkloadCount,
      gender: users.gender,
      dateOfBirth: users.dateOfBirth,
      occupation: users.occupation,
      miscellaneous: users.miscellaneous,
      timezone: users.timezone,
      role: users.role,
      isActive: users.isActive,
      lastActiveAt: users.lastActiveAt,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export function shouldUpdateLastActiveAt(lastActiveAt: Date | null | undefined, now = new Date()) {
  if (!lastActiveAt) {
    return true;
  }

  return now.getTime() - lastActiveAt.getTime() >= USER_ACTIVITY_UPDATE_INTERVAL_MS;
}

export async function touchUserLastActiveAtById(id: number, now = new Date()): Promise<void> {
  await db.update(users).set({ lastActiveAt: now }).where(eq(users.id, id));
}

export async function touchUserLastActiveAtIfNeeded(
  user: UserActivitySnapshot,
  now = new Date()
): Promise<void> {
  if (!shouldUpdateLastActiveAt(user.lastActiveAt, now)) {
    return;
  }

  await touchUserLastActiveAtById(user.id, now);
}

export async function getUserProfileById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      login: users.login,
      name: users.name,
      lastName: users.lastName,
      patronymic: users.patronymic,
      heightCm: users.heightCm,
      weeklyWorkloadCount: users.weeklyWorkloadCount,
      gender: users.gender,
      dateOfBirth: users.dateOfBirth,
      occupation: users.occupation,
      miscellaneous: users.miscellaneous,
      timezone: users.timezone,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function updateUserProfileById(id: number, input: UserProfileUpdateInput) {
  const [user] = await db.update(users).set(input).where(eq(users.id, id)).returning({
    id: users.id,
    email: users.email,
    login: users.login,
    name: users.name,
    lastName: users.lastName,
    patronymic: users.patronymic,
    heightCm: users.heightCm,
    weeklyWorkloadCount: users.weeklyWorkloadCount,
    gender: users.gender,
    dateOfBirth: users.dateOfBirth,
    occupation: users.occupation,
    miscellaneous: users.miscellaneous,
    timezone: users.timezone,
    role: users.role,
  });

  return user || null;
}

export async function getUserEmailCredentialsById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function updateUserEmailById(id: number, email: string) {
  const [user] = await db
    .update(users)
    .set({ email, emailVerified: null })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      login: users.login,
      name: users.name,
      lastName: users.lastName,
      patronymic: users.patronymic,
      heightCm: users.heightCm,
      weeklyWorkloadCount: users.weeklyWorkloadCount,
      gender: users.gender,
      dateOfBirth: users.dateOfBirth,
      occupation: users.occupation,
      miscellaneous: users.miscellaneous,
      timezone: users.timezone,
      role: users.role,
    });

  return user || null;
}

export async function getUserPasswordHashById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function getUserDeletionCredentialsById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function updateUserPasswordHashById(id: number, passwordHash: string) {
  const [user] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return user || null;
}
