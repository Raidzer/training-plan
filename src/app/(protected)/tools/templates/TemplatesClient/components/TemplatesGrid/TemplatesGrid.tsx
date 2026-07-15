import type { TemplateSummary } from "../../types/templatesTypes";
import { TemplateCard } from "../TemplateCard/TemplateCard";
import { TemplatesEmptyState } from "../TemplatesEmptyState/TemplatesEmptyState";
import styles from "./TemplatesGrid.module.scss";

type TemplatesGridProps = {
  templates: TemplateSummary[];
  hasTemplates: boolean;
  isFiltering: boolean;
  deletingTemplateId: number | null;
  onDelete: (template: TemplateSummary) => Promise<void>;
  onResetFilters: () => void;
};

export function TemplatesGrid({
  templates,
  hasTemplates,
  isFiltering,
  deletingTemplateId,
  onDelete,
  onResetFilters,
}: TemplatesGridProps) {
  if (!hasTemplates) {
    return <TemplatesEmptyState mode="empty" />;
  }

  if (templates.length === 0 && isFiltering) {
    return <TemplatesEmptyState mode="no-results" onResetFilters={onResetFilters} />;
  }

  return (
    <ul id="templates-list" className={styles.grid} role="list">
      {templates.map((template) => (
        <li key={template.id}>
          <TemplateCard
            template={template}
            isDeleting={deletingTemplateId === template.id}
            hasPendingDelete={deletingTemplateId !== null}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
