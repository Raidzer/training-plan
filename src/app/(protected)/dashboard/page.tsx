import type { Metadata } from "next";
import { requireAuth } from "@/server/authGuards";
import { DashboardClient } from "./DashboardClient/DashboardClient";

export const metadata: Metadata = {
  title: "Личный кабинет | СПИРОС",
};

export default async function DashboardPage() {
  const session = await requireAuth();

  return <DashboardClient session={session} />;
}
