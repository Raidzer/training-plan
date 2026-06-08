import { requireAdmin } from "@/server/authGuards";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { AdminUserRecordsContent } from "./AdminUserRecordsPage/AdminUserRecordsPage";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserRecordsPage({ params }: Props) {
  await requireAdmin();

  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);

  const user = await db
    .select({ name: users.name, lastName: users.lastName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((res) => res[0]);

  const userLabel = user ? `${user.name} ${user.lastName || ""}`.trim() : `ID: ${userId}`;

  return <AdminUserRecordsContent userId={userId} userLabel={userLabel} />;
}
