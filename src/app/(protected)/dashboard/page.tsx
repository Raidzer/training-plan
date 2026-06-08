import { requireAuth } from "@/server/authGuards";
import { DashboardClient } from "./DashboardClient/DashboardClient";

export default async function Dashboard() {
  const session = await requireAuth();

  return <DashboardClient session={session} />;
}
