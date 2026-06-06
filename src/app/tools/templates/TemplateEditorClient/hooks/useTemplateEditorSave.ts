"use client";

import { useRouter } from "next/navigation";
import { createTemplate, updateTemplate } from "@/app/actions/diaryTemplates";
import type { NewDiaryResultTemplate } from "@/shared/types/diary-templates";
import type { TemplateEditorClientProps } from "../types/templateEditorTypes";

export const useTemplateEditorSave = ({ template, userId }: TemplateEditorClientProps) => {
  const router = useRouter();

  const handleSave = async (values: NewDiaryResultTemplate) => {
    if (template) {
      await updateTemplate(template.id, values);
      router.refresh();
      return;
    }

    const newId = await createTemplate({ ...values, userId });
    router.replace(`/tools/templates/${newId}`);
  };

  const handleBack = () => {
    router.back();
  };

  return {
    handleSave,
    handleBack,
  };
};
