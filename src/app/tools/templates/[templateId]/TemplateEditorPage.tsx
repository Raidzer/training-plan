"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { createTemplate, updateTemplate } from "@/app/actions/diaryTemplates";
import type { DiaryResultTemplate, NewDiaryResultTemplate } from "@/shared/types/diary-templates";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

type Props = {
  template: DiaryResultTemplate | null;
  userId: number;
};

export const TemplateEditorPage = ({ template, userId }: Props) => {
  const router = useRouter();

  const handleSave = async (values: NewDiaryResultTemplate) => {
    if (template) {
      await updateTemplate(template.id, values);
      router.refresh();
    } else {
      const newId = await createTemplate({ ...values, userId });
      // Redirect to the edit page of the new template to stay in context
      router.replace(`/tools/templates/${newId}`);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "100%", margin: "0 auto" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <ArrowLeftOutlined
          style={{ fontSize: 20, cursor: "pointer" }}
          onClick={() => router.back()}
        />
        <Title level={2} style={{ margin: 0 }}>
          {template ? `Редактирование: ${template.name}` : "Новый шаблон"}
        </Title>
      </div>

      <TemplateEditor
        initialValues={template || {}}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </div>
  );
};
