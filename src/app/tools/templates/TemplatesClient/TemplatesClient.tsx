"use client";

import type { ComponentProps } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { TEMPLATES_LABELS } from "./constants/templatesConstants";
import styles from "./TemplatesClient.module.scss";

type TemplatesClientProps = {
  initialTemplates: ComponentProps<typeof TemplateManager>["initialTemplates"];
  userId: number;
};

export function TemplatesClient({ initialTemplates, userId }: TemplatesClientProps) {
  return (
    <main className={styles.page}>
      <PageHeader title={TEMPLATES_LABELS.title} subtitle={TEMPLATES_LABELS.subtitle} />
      <TemplateManager initialTemplates={initialTemplates} userId={userId} />
    </main>
  );
}
