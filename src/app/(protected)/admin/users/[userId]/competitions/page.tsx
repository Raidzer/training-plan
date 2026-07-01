import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/authGuards";
import { listCompetitionBlocksByUser } from "@/server/competitions";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { AdminUserCompetitionsContent } from "./AdminUserCompetitionsPage/AdminUserCompetitionsPage";
import {
  buildAdminUserCompetitionsUserLabel,
  mapCompetitionBlocksToAdminItems,
} from "./AdminUserCompetitionsPage/utils/adminUserCompetitionsUtils";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserCompetitionsPage({ params }: Props) {
  await requireAdmin();

  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId) || userId <= 0) {
    notFound();
  }

  const [user, blocks] = await Promise.all([
    db
      .select({ name: users.name, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((res) => res[0] ?? null),
    listCompetitionBlocksByUser(userId),
  ]);

  const userLabel = buildAdminUserCompetitionsUserLabel(user, userId);
  const competitionBlocks = mapCompetitionBlocksToAdminItems(blocks);

  return <AdminUserCompetitionsContent userLabel={userLabel} blocks={competitionBlocks} />;
}
