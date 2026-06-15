import { auth } from "@/auth";

export async function getAuthenticatedCompetitionUserId(): Promise<number | null> {
  const session = await auth();
  if (!session) {
    return null;
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  return userId;
}
