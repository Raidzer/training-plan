import { desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { registrationInvites, users } from "@/db/schema";
import { AdminInvitesClient, type AdminInviteRow } from "./AdminInvitesClient";

type InviteStatus = "active" | "used" | "expired";

const getInviteStatus = (
  invite: {
    usedAt: Date | null;
    usedByUserId: number | null;
    expiresAt: Date;
  },
  now: Date
): InviteStatus => {
  if (invite.usedAt || invite.usedByUserId) {
    return "used";
  }
  if (invite.expiresAt <= now) {
    return "expired";
  }
  return "active";
};

export default async function AdminInvitesPage() {
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
    .limit(200);

  const userIds = new Set<number>();
  for (const row of rows) {
    userIds.add(row.createdByUserId);
    if (row.usedByUserId) {
      userIds.add(row.usedByUserId);
    }
  }

  let userRows: { id: number; name: string; email: string }[] = [];
  if (userIds.size > 0) {
    userRows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, Array.from(userIds)));
  }

  const userMap = new Map(
    userRows.map((row) => [row.id, { id: row.id, name: row.name, email: row.email }])
  );

  const now = new Date();
  const data: AdminInviteRow[] = rows.map((row) => {
    const createdBy = userMap.get(row.createdByUserId) ?? null;
    let usedBy: { id: number; name: string; email: string } | null = null;
    if (row.usedByUserId) {
      usedBy = userMap.get(row.usedByUserId) ?? null;
    }
    return {
      id: row.id,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      usedAt: row.usedAt ? row.usedAt.toISOString() : null,
      status: getInviteStatus(row, now),
      createdBy,
      usedBy,
    };
  });

  return <AdminInvitesClient invites={data} />;
}
