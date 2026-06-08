import { getTemplateById } from "@/app/actions/diaryTemplates";
import { requireAdmin } from "@/server/authGuards";
import { TemplateEditorClient } from "../TemplateEditorClient/TemplateEditorClient";

type Props = {
  params: Promise<{ templateId: string }>;
};

export default async function Page({ params }: Props) {
  const { templateId } = await params;

  const session = await requireAdmin();

  const userId = Number(session.user.id);
  let template = null;

  if (templateId !== "new") {
    const id = Number(templateId);
    if (!Number.isNaN(id)) {
      template = await getTemplateById(id);
    }
  }

  return <TemplateEditorClient template={template} userId={userId} />;
}
