import type { Metadata } from "next";
import { getTemplates } from "@/app/actions/diaryTemplates";
import { requireAdmin } from "@/server/authGuards";
import { TemplatesClient } from "./TemplatesClient/TemplatesClient";
import type { TemplateSummary } from "./TemplatesClient/types/templatesTypes";

export const metadata: Metadata = {
  title: "Шаблоны отчётов | СПИРОС",
  description: "Управление шаблонами и правилами формирования ежедневных отчётов спортсменов.",
};

export default async function TemplatesPage() {
  const session = await requireAdmin();

  const userId = Number(session.user.id);
  const templates = await getTemplates(userId);
  const templateSummaries: TemplateSummary[] = templates.map((template) => ({
    id: template.id,
    userId: template.userId,
    name: template.name,
    matchPattern: template.matchPattern,
  }));

  return <TemplatesClient initialTemplates={templateSummaries} />;
}
