"use client";

import { TemplateEditorForm } from "./components/TemplateEditorForm/TemplateEditorForm";
import { TemplateEditorHeader } from "./components/TemplateEditorHeader/TemplateEditorHeader";
import { useTemplateEditor } from "./hooks/useTemplateEditor";
import type { TemplateEditorClientProps } from "./types/templateEditorTypes";
import styles from "./TemplateEditorClient.module.scss";

export function TemplateEditorClient(props: TemplateEditorClientProps) {
  const editor = useTemplateEditor(props);

  return (
    <div className={styles.page}>
      <TemplateEditorHeader
        title={editor.title}
        subtitle={editor.subtitle}
        saveStatus={editor.saveStatus}
        saveStatusLabel={editor.saveStatusLabel}
        onBack={editor.handleBack}
      />

      <div className={styles.workspace}>
        <TemplateEditorForm
          form={editor.form}
          initialValues={editor.initialValues}
          isSaving={editor.isSaving}
          saveStatus={editor.saveStatus}
          saveStatusLabel={editor.saveStatusLabel}
          onValuesChange={editor.handleValuesChange}
          onSave={editor.handleSave}
          onCancel={editor.handleBack}
        />
      </div>
    </div>
  );
}
