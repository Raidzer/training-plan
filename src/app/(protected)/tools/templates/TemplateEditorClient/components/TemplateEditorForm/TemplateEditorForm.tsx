"use client";

import { Form } from "antd";
import type { FormInstance } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import type { TemplateEditorFormValues, TemplateSaveStatus } from "../../types/templateEditorTypes";
import { TemplateBasicsSection } from "../TemplateBasicsSection/TemplateBasicsSection";
import { TemplateEditorActions } from "../TemplateEditorActions/TemplateEditorActions";
import { TemplateFieldsSection } from "../TemplateFieldsSection/TemplateFieldsSection";
import { TemplateOutputSection } from "../TemplateOutputSection/TemplateOutputSection";
import styles from "./TemplateEditorForm.module.scss";

type TemplateEditorFormProps = {
  form: FormInstance<TemplateEditorFormValues>;
  initialValues: TemplateEditorFormValues;
  isSaving: boolean;
  saveStatus: TemplateSaveStatus;
  saveStatusLabel: string;
  onValuesChange: () => void;
  onSave: (values: TemplateEditorFormValues) => Promise<void>;
  onCancel: () => void;
};

export function TemplateEditorForm({
  form,
  initialValues,
  isSaving,
  saveStatus,
  saveStatusLabel,
  onValuesChange,
  onSave,
  onCancel,
}: TemplateEditorFormProps) {
  return (
    <Form<TemplateEditorFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      disabled={isSaving}
      aria-label={TEMPLATE_EDITOR_LABELS.formAriaLabel}
      className={styles.form}
      scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
      onValuesChange={onValuesChange}
      onFinish={onSave}
    >
      <TemplateBasicsSection />
      <TemplateFieldsSection />
      <TemplateOutputSection />
      <TemplateEditorActions
        isSaving={isSaving}
        saveStatus={saveStatus}
        saveStatusLabel={saveStatusLabel}
        onCancel={onCancel}
      />
    </Form>
  );
}
