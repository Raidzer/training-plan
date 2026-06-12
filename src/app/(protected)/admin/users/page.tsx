import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/authGuards";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { AdminUsersClient } from "./AdminUsersClient/AdminUsersClient";
import type { AdminUserRow } from "./AdminUsersClient/types/adminUsersTypes";

export default async function AdminUsersPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      lastName: users.lastName,
      gender: users.gender,
      email: users.email,
      login: users.login,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const data: AdminUserRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    lastName: row.lastName ?? "",
    gender: row.gender,
    email: row.email,
    login: row.login,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
  }));

  return <AdminUsersClient users={data} />;
}
