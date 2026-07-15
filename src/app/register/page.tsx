import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageShell } from "@/components/AuthPageShell/AuthPageShell";
import { RegisterClient } from "./RegisterClient/RegisterClient";
import { RegisterLoadingState } from "./RegisterClient/components/RegisterLoadingState/RegisterLoadingState";

export const metadata: Metadata = {
  title: "Регистрация | СПИРОС",
  description: "Создание аккаунта участника СПИРОС по персональному приглашению.",
};

export default function RegisterPage() {
  return (
    <AuthPageShell mode="register">
      <Suspense fallback={<RegisterLoadingState />}>
        <RegisterClient />
      </Suspense>
    </AuthPageShell>
  );
}
