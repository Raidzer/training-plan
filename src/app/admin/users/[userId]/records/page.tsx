import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RecordsClient } from "@/app/profile/records/RecordsClient";
import { Button } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserRecordsPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);

  const user = await db
    .select({ name: users.name, lastName: users.lastName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((res) => res[0]);

  const userLabel = user ? `${user.name} ${user.lastName || ""}`.trim() : `ID: ${userId}`;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/users">
          <Button icon={<ArrowLeftOutlined />}>Назад к списку пользователей</Button>
        </Link>
      </div>

      <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
        Редактирование рекордов: {userLabel}
      </h3>

      <RecordsClient apiUrl={`/api/admin/users/${userId}/records`} />
    </div>
  );
}
