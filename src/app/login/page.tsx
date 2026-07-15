import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { AuthPageShell } from "@/components/AuthPageShell/AuthPageShell";
import { LoginClient } from "./LoginClient/LoginClient";

export const metadata: Metadata = {
  title: "Вход в личный кабинет | СПИРОС",
  description: "Вход в личный кабинет бегового клуба СПИРОС.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell mode="login">
      <LoginClient />
    </AuthPageShell>
  );
}
