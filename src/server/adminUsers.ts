import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

type UserRole = "admin" | "coach" | "athlete";

export async function updateUserPasswordHashById(
  userId: number,
  passwordHash: string
): Promise<boolean> {
  const [updated] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  return Boolean(updated);
}

export async function updateUserRoleById(userId: number, role: UserRole) {
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role });

  if (!updated) {
    return null;
  }

  return updated;
}

export async function updateUserStatusById(userId: number, isActive: boolean) {
  const [updated] = await db
    .update(users)
    .set({ isActive })
    .where(eq(users.id, userId))
    .returning({ id: users.id, isActive: users.isActive });

  if (!updated) {
    return null;
  }

  return updated;
}
