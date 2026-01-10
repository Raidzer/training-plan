import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecordsClient } from "./RecordsClient";

export default async function RecordsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <RecordsClient />;
}
