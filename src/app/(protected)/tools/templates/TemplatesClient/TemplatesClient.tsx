"use client";

import { TemplatesErrorBanner } from "./components/TemplatesErrorBanner/TemplatesErrorBanner";
import { TemplatesGrid } from "./components/TemplatesGrid/TemplatesGrid";
import { TemplatesHeader } from "./components/TemplatesHeader/TemplatesHeader";
import { TemplatesOverview } from "./components/TemplatesOverview/TemplatesOverview";
import { TemplatesToolbar } from "./components/TemplatesToolbar/TemplatesToolbar";
import { TEMPLATES_LABELS } from "./constants/templatesConstants";
import { useTemplatesList } from "./hooks/useTemplatesList";
import type { TemplateSummary } from "./types/templatesTypes";
import styles from "./TemplatesClient.module.scss";

type TemplatesClientProps = {
  initialTemplates: TemplateSummary[];
};

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const {
    templates,
    filteredTemplates,
    filter,
    query,
    stats,
    deletingTemplateId,
    deleteError,
    statusMessage,
    isFiltering,
    setFilter,
    setQuery,
    deleteTemplateById,
    dismissDeleteError,
    resetFilters,
  } = useTemplatesList(initialTemplates);

  return (
    <div className={styles.page}>
      <TemplatesHeader />
      <TemplatesOverview stats={stats} />

      <section className={styles.workspace} aria-labelledby="templates-catalog-title">
        <div className={styles.workspaceHeading}>
          <div>
            <span className={styles.workspaceEyebrow}>{TEMPLATES_LABELS.catalogEyebrow}</span>
            <h2 id="templates-catalog-title" className={styles.workspaceTitle}>
              {TEMPLATES_LABELS.catalogTitle}
            </h2>
          </div>
          <p className={styles.workspaceDescription}>{TEMPLATES_LABELS.catalogDescription}</p>
        </div>

        <TemplatesToolbar
          query={query}
          filter={filter}
          visibleCount={filteredTemplates.length}
          totalCount={templates.length}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
        />

        {deleteError ? (
          <TemplatesErrorBanner message={deleteError} onDismiss={dismissDeleteError} />
        ) : null}

        <TemplatesGrid
          templates={filteredTemplates}
          hasTemplates={templates.length > 0}
          isFiltering={isFiltering}
          deletingTemplateId={deletingTemplateId}
          onDelete={deleteTemplateById}
          onResetFilters={resetFilters}
        />

        <p className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
          {statusMessage}
        </p>
      </section>
    </div>
  );
}
