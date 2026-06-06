import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VerifyTelegramClient } from "./VerifyTelegramClient/VerifyTelegramClient";

export default async function VerifyTelegramPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <VerifyTelegramClient />;
}
