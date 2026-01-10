import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ShoesClient } from "./ShoesClient";

export default async function ShoesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <ShoesClient />;
}
