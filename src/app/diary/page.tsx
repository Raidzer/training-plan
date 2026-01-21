import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DiaryClient } from "./DiaryClient/DiaryClient";

export default async function DiaryPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <DiaryClient />;
}
