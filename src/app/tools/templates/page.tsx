import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplates } from "@/app/actions/diaryTemplates";
import { TemplateManager } from "@/components/templates/TemplateManager";
import Title from "antd/es/typography/Title";

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

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Менеджер шаблонов</Title>
      <p style={{ marginBottom: "24px", color: "#888" }}>
        Настройте шаблоны для быстрого заполнения отчетов о результатах тренировок.
      </p>
      <TemplateManager initialTemplates={templates} userId={userId} />
    </div>
  );
}
