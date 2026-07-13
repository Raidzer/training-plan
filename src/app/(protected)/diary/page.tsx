import type { Metadata } from "next";
import { requireAuth } from "@/server/authGuards";
import { DiaryClient } from "./DiaryClient/DiaryClient";

export const metadata: Metadata = {
  title: "Ежедневный отчёт | СПИРОС",
};

export default async function DiaryPage() {
  const session = await requireAuth();

  return <DiaryClient userId={Number(session.user.id)} />;
}
