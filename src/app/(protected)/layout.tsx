import { requireAuth } from "@/server/authGuards";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return <>{children}</>;
}
