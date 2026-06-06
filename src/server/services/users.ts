import { eq, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export type UserProfileUpdateInput = {
  name: string;
  lastName: string | null;
  gender: string;
  timezone: string;
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
      gender: users.gender,
      timezone: users.timezone,
      role: users.role,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function getUserProfileById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      login: users.login,
      name: users.name,
      lastName: users.lastName,
      gender: users.gender,
      timezone: users.timezone,
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
    gender: users.gender,
    timezone: users.timezone,
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
      gender: users.gender,
      timezone: users.timezone,
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

export async function updateUserPasswordHashById(id: number, passwordHash: string) {
  const [user] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return user || null;
}
