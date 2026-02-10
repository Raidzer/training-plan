import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { AdminUsersClient, type AdminUserRow } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    redirect("/dashboard");
  }

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
  }));

  return <AdminUsersClient users={data} />;
}
