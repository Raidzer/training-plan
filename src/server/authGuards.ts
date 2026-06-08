import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireAuth = cache(async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return session;
});

export const requireAdmin = cache(async () => {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
});
