"use client";

import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplateEditorHeader } from "./components/TemplateEditorHeader/TemplateEditorHeader";
import { TEMPLATE_EDITOR_LABELS } from "./constants/templateEditorConstants";
import { useTemplateEditorSave } from "./hooks/useTemplateEditorSave";
import type { TemplateEditorClientProps } from "./types/templateEditorTypes";
import styles from "./TemplateEditorClient.module.scss";

export function TemplateEditorClient({ template, userId }: TemplateEditorClientProps) {
  const { handleSave, handleBack } = useTemplateEditorSave({ template, userId });
  const title = template
    ? `${TEMPLATE_EDITOR_LABELS.editTitlePrefix}: ${template.name}`
    : TEMPLATE_EDITOR_LABELS.newTemplateTitle;

  return (
    <main className={styles.page}>
      <TemplateEditorHeader title={title} onBack={handleBack} />
      <TemplateEditor initialValues={template || {}} onSave={handleSave} onCancel={handleBack} />
    </main>
  );
}
