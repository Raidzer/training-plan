import type { DiaryResultTemplate } from "@/shared/types/diary-templates";

export type TemplateEditorClientProps = {
  template: DiaryResultTemplate | null;
  userId: number;
};

export type TemplateFieldType = "text" | "number" | "time" | "list";

export type TemplateListItemType = Exclude<TemplateFieldType, "list">;

export type TemplateSchemaField = {
  key: string;
  label: string;
  type: TemplateFieldType;
  weight?: number | null;
  defaultValue?: string | number | null;
  itemType?: TemplateListItemType;
  listSize?: number | null;
};

export type TemplateEditorFormValues = {
  name: string;
  code?: string | null;
  matchPattern?: string | null;
  isInline?: boolean;
  schema?: TemplateSchemaField[];
  outputTemplate: string;
};

export type TemplateSaveStatus = "pristine" | "dirty" | "saving" | "saved" | "error";
