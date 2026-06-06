import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplateById } from "@/app/actions/diaryTemplates";
import { TemplateEditorClient } from "../TemplateEditorClient/TemplateEditorClient";

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
    if (!Number.isNaN(id)) {
      template = await getTemplateById(id);
    }
  }

  return <TemplateEditorClient template={template} userId={userId} />;
}
