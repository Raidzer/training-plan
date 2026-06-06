import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplates } from "@/app/actions/diaryTemplates";
import { TemplatesClient } from "./TemplatesClient/TemplatesClient";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const userId = Number(session.user.id);
  const templates = await getTemplates(userId);

  return <TemplatesClient initialTemplates={templates} userId={userId} />;
}
