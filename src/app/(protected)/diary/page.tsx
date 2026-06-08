import { requireAuth } from "@/server/authGuards";
import { DiaryClient } from "./DiaryClient/DiaryClient";

export default async function DiaryPage() {
  const session = await requireAuth();

  return <DiaryClient userId={Number(session.user.id)} />;
}
