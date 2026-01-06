import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VerifyEmailClient } from "./VerifyEmailClient";

export default async function VerifyEmailPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <VerifyEmailClient />;
}
