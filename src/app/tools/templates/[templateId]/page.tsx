import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplateById } from "@/app/actions/diaryTemplates";
import { TemplateEditorPage } from "./TemplateEditorPage";

type Props = {
  params: Promise<{ templateId: string }>;
};

export default async function Page({ params }: Props) {
  const { templateId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = Number(session.user.id);
  let template = null;

  if (templateId !== "new") {
    const id = Number(templateId);
    if (!isNaN(id)) {
      template = await getTemplateById(id);
    }
  }

  if (template) {
    if (template.userId !== userId && template.userId !== null) {
    }
    if (template.userId === null && session.user.role !== "admin") {
    }
  }

  return <TemplateEditorPage template={template} userId={userId} />;
}
