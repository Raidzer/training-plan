import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateById } from "@/app/actions/diaryTemplates";
import { requireAdmin } from "@/server/authGuards";
import { TemplateEditorClient } from "../TemplateEditorClient/TemplateEditorClient";

type TemplateEditorPageProps = {
  params: Promise<{ templateId: string }>;
};

export const metadata: Metadata = {
  title: "Редактор шаблона | СПИРОС",
  description: "Создание и настройка шаблона ежедневного отчёта спортсмена.",
};

export default async function TemplateEditorPage({ params }: TemplateEditorPageProps) {
  const { templateId } = await params;
  const session = await requireAdmin();
  const userId = Number(session.user.id);

  if (templateId === "new") {
    return <TemplateEditorClient template={null} userId={userId} />;
  }

  const numericTemplateId = Number(templateId);

  if (!Number.isSafeInteger(numericTemplateId) || numericTemplateId <= 0) {
    notFound();
  }

  const template = await getTemplateById(numericTemplateId);

  if (!template) {
    notFound();
  }

  return <TemplateEditorClient template={template} userId={userId} />;
}
