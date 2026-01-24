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

  if (session.user.role !== "admin") {
    redirect("/dashboard");
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
    // Security checks can be implemented here if needed
  }

  return <TemplateEditorPage template={template} userId={userId} />;
}
