import type { DiaryResultTemplate } from "@/shared/types/diary-templates";

export type TemplateEditorClientProps = {
  template: DiaryResultTemplate | null;
  userId: number;
};
