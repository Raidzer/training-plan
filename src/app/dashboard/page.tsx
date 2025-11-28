import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { DashboardClient } from "./DashboardClient";

export default async function Dashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  return <DashboardClient session={session} />;
}
