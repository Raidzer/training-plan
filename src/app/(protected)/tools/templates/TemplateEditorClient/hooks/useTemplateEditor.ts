"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Form } from "antd";
import { useRouter } from "next/navigation";
import { createTemplate, updateTemplate } from "@/app/actions/diaryTemplates";
import { TEMPLATE_EDITOR_LABELS } from "../constants/templateEditorConstants";
import type {
  TemplateEditorClientProps,
  TemplateEditorFormValues,
  TemplateSaveStatus,
} from "../types/templateEditorTypes";
import {
  buildTemplatePayload,
  getTemplateEditorTitle,
  getTemplateFormInitialValues,
  getTemplateSaveStatusLabel,
} from "../utils/templateEditorUtils";

const TEMPLATES_PATH = "/tools/templates";

export function useTemplateEditor({ template, userId }: TemplateEditorClientProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<TemplateEditorFormValues>();
  const [saveStatus, setSaveStatus] = useState<TemplateSaveStatus>("pristine");
  const isNewTemplate = template === null;
  const initialValues = useMemo(() => getTemplateFormInitialValues(template), [template]);
  const hasUnsavedChanges = saveStatus === "dirty" || saveStatus === "error";

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const canLeaveEditor = () => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm(TEMPLATE_EDITOR_LABELS.leaveConfirmation);
  };

  const handleBack = () => {
    if (!canLeaveEditor()) {
      return;
    }

    router.push(TEMPLATES_PATH);
  };

  const handleValuesChange = () => {
    setSaveStatus((currentStatus) => {
      if (currentStatus === "saving") {
        return currentStatus;
      }

      return "dirty";
    });
  };

  const handleSave = async (values: TemplateEditorFormValues) => {
    setSaveStatus("saving");

    try {
      const payload = buildTemplatePayload(values, template);

      if (template) {
        await updateTemplate(template.id, payload);
        setSaveStatus("saved");
        message.success(TEMPLATE_EDITOR_LABELS.saveSuccess);
        return;
      }

      const templateId = await createTemplate({ ...payload, userId });
      setSaveStatus("saved");
      message.success(TEMPLATE_EDITOR_LABELS.saveSuccess);
      router.replace(`${TEMPLATES_PATH}/${templateId}`);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      message.error(TEMPLATE_EDITOR_LABELS.saveError);
    }
  };

  return {
    form,
    initialValues,
    isNewTemplate,
    title: getTemplateEditorTitle(template?.name, isNewTemplate),
    subtitle: isNewTemplate
      ? TEMPLATE_EDITOR_LABELS.newTemplateSubtitle
      : TEMPLATE_EDITOR_LABELS.editTemplateSubtitle,
    saveStatus,
    saveStatusLabel: getTemplateSaveStatusLabel(saveStatus),
    isSaving: saveStatus === "saving",
    handleBack,
    handleSave,
    handleValuesChange,
  };
}
