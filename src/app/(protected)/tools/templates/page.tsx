import { getTemplates } from "@/app/actions/diaryTemplates";
import { requireAdmin } from "@/server/authGuards";
import { TemplatesClient } from "./TemplatesClient/TemplatesClient";

export default async function TemplatesPage() {
  const session = await requireAdmin();

  const userId = Number(session.user.id);
  const templates = await getTemplates(userId);

  return <TemplatesClient initialTemplates={templates} userId={userId} />;
}
