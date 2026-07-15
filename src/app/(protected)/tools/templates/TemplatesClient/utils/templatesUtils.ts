import type {
  TemplateFilter,
  TemplateSummary,
  TemplatesOverviewStats,
} from "../types/templatesTypes";

export function getTemplateEditPath(templateId: number): string {
  return `/tools/templates/${templateId}`;
}

export function getTemplatePatterns(matchPattern: string | null): string[] {
  if (!matchPattern) {
    return [];
  }

  return Array.from(
    new Set(
      matchPattern
        .split(";")
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern.length > 0)
    )
  );
}

export function getTemplatesOverviewStats(templates: TemplateSummary[]): TemplatesOverviewStats {
  return templates.reduce<TemplatesOverviewStats>(
    (stats, template) => {
      stats.total += 1;

      if (template.userId === null) {
        stats.system += 1;
      } else {
        stats.user += 1;
      }

      return stats;
    },
    { total: 0, user: 0, system: 0 }
  );
}

export function filterTemplates(
  templates: TemplateSummary[],
  query: string,
  filter: TemplateFilter
): TemplateSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");

  return templates.filter((template) => {
    if (filter === "user" && template.userId === null) {
      return false;
    }

    if (filter === "system" && template.userId !== null) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const searchableText = [template.name, ...getTemplatePatterns(template.matchPattern)]
      .join(" ")
      .toLocaleLowerCase("ru");

    return searchableText.includes(normalizedQuery);
  });
}
