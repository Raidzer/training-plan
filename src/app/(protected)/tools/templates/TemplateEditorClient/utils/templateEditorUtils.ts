import type { NewDiaryResultTemplate } from "@/shared/types/diary-templates";
import { TEMPLATE_EDITOR_LABELS } from "../constants/templateEditorConstants";
import type {
  TemplateEditorClientProps,
  TemplateEditorFormValues,
  TemplateSaveStatus,
  TemplateSchemaField,
} from "../types/templateEditorTypes";

const TEMPLATE_CODE_PATTERN = /^[a-zA-Z0-9_]+$/;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}

export function isTemplateCodeValid(value: string): boolean {
  return TEMPLATE_CODE_PATTERN.test(value);
}

export function getTemplateSchema(value: unknown): TemplateSchemaField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((field): field is TemplateSchemaField => {
    if (!field || typeof field !== "object") {
      return false;
    }

    const candidate = field as Partial<TemplateSchemaField>;
    return (
      typeof candidate.key === "string" &&
      typeof candidate.label === "string" &&
      ["text", "number", "time", "list"].includes(String(candidate.type))
    );
  });
}

export function getTemplateFormInitialValues(
  template: TemplateEditorClientProps["template"]
): TemplateEditorFormValues {
  return {
    name: template?.name ?? "",
    code: template?.code ?? null,
    matchPattern: template?.matchPattern ?? null,
    isInline: template?.isInline ?? false,
    schema: getTemplateSchema(template?.schema),
    outputTemplate: template?.outputTemplate ?? "",
  };
}

export function buildTemplatePayload(
  values: TemplateEditorFormValues,
  template: TemplateEditorClientProps["template"]
): NewDiaryResultTemplate {
  const schema = (values.schema ?? []).map((field) => ({
    ...field,
    key: field.key.trim(),
    label: field.label.trim(),
  }));

  return {
    userId: template ? template.userId : undefined,
    name: values.name.trim(),
    code: normalizeOptionalText(values.code)?.toUpperCase() ?? null,
    matchPattern: normalizeOptionalText(values.matchPattern),
    schema,
    outputTemplate: values.outputTemplate,
    isInline: Boolean(values.isInline),
    calculations: template ? template.calculations : [],
    sortOrder: template?.sortOrder ?? 0,
    type: template?.type ?? "common",
    level: template?.level ?? "general",
  };
}

export function getTemplateSaveStatusLabel(status: TemplateSaveStatus): string {
  if (status === "dirty") {
    return TEMPLATE_EDITOR_LABELS.dirtyStatus;
  }

  if (status === "saving") {
    return TEMPLATE_EDITOR_LABELS.savingStatus;
  }

  if (status === "saved") {
    return TEMPLATE_EDITOR_LABELS.savedStatus;
  }

  if (status === "error") {
    return TEMPLATE_EDITOR_LABELS.errorStatus;
  }

  return TEMPLATE_EDITOR_LABELS.pristineStatus;
}

export function getTemplateEditorTitle(
  templateName: string | undefined,
  isNewTemplate: boolean
): string {
  if (isNewTemplate) {
    return TEMPLATE_EDITOR_LABELS.newTemplateTitle;
  }

  const normalizedName = templateName?.trim();
  return normalizedName || TEMPLATE_EDITOR_LABELS.editTemplateFallbackTitle;
}
