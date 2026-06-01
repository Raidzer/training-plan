import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplates } from "@/app/actions/diaryTemplates";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { PageHeader } from "@/components/PageHeader";
import styles from "./templates.module.scss";

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
    <main className={styles.page}>
      <PageHeader
        title="Менеджер шаблонов"
        subtitle="Настройте шаблоны для быстрого заполнения отчетов о результатах тренировок."
      />
      <TemplateManager initialTemplates={templates} userId={userId} />
    </main>
  );
}
