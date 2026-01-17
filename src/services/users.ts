import { eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function getUserByIdentifier(identifier: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.login, identifier)));

  return user || null;
}

export async function getUserById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      passwordHash: users.passwordHash,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, id));

  return user || null;
}
