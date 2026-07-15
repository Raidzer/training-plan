"use client";

import { useCallback, useMemo, useState } from "react";
import { deleteTemplate } from "@/app/actions/diaryTemplates";
import { TEMPLATES_LABELS } from "../constants/templatesConstants";
import type { TemplateFilter, TemplateSummary } from "../types/templatesTypes";
import { filterTemplates, getTemplatesOverviewStats } from "../utils/templatesUtils";

export function useTemplatesList(initialTemplates: TemplateSummary[]) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const filteredTemplates = useMemo(
    () => filterTemplates(templates, query, filter),
    [filter, query, templates]
  );
  const stats = useMemo(() => getTemplatesOverviewStats(templates), [templates]);
  const isFiltering = query.trim().length > 0 || filter !== "all";

  const deleteTemplateById = useCallback(async (template: TemplateSummary) => {
    if (template.userId === null) {
      return;
    }

    setDeleteError(null);
    setStatusMessage("");
    setDeletingTemplateId(template.id);

    try {
      await deleteTemplate(template.id);
      setTemplates((currentTemplates) =>
        currentTemplates.filter((currentTemplate) => currentTemplate.id !== template.id)
      );
      setStatusMessage(TEMPLATES_LABELS.deleteSuccess(template.name));
    } catch {
      setDeleteError(TEMPLATES_LABELS.deleteError(template.name));
    } finally {
      setDeletingTemplateId(null);
    }
  }, []);

  const dismissDeleteError = useCallback(() => {
    setDeleteError(null);
  }, []);

  const resetFilters = useCallback(() => {
    setQuery("");
    setFilter("all");
  }, []);

  return {
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
  };
}
