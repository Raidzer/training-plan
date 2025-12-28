import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DiaryPeriodClient } from "./DiaryPeriodClient";

export default async function DiaryPeriodPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <DiaryPeriodClient />;
}
