import { describe, expect, it } from "vitest";
import type {
  TemplateFilter,
  TemplateSummary,
} from "@/app/(protected)/tools/templates/TemplatesClient/types/templatesTypes";
import {
  filterTemplates,
  getTemplateEditPath,
  getTemplatePatterns,
  getTemplatesOverviewStats,
} from "@/app/(protected)/tools/templates/TemplatesClient/utils/templatesUtils";

function createTemplate(overrides: Partial<TemplateSummary> = {}): TemplateSummary {
  return {
    id: 1,
    userId: 20,
    name: "Темповая работа",
    matchPattern: "темп; бег",
    ...overrides,
  };
}

describe("templatesUtils", () => {
  it("считает пользовательские и системные шаблоны", () => {
    const templates = [
      createTemplate(),
      createTemplate({ id: 2, userId: null, name: "Системный" }),
      createTemplate({ id: 3, name: "Интервалы" }),
    ];

    expect(getTemplatesOverviewStats(templates)).toEqual({
      total: 3,
      user: 2,
      system: 1,
    });
  });

  it("разделяет, очищает и дедуплицирует ключевые фразы", () => {
    expect(getTemplatePatterns(" темп ; бег;; темп ")).toEqual(["темп", "бег"]);
    expect(getTemplatePatterns(null)).toEqual([]);
  });

  it.each<[TemplateFilter, number[]]>([
    ["all", [1, 2, 3]],
    ["user", [1, 3]],
    ["system", [2]],
  ])("фильтрует шаблоны по типу %s", (filter, expectedIds) => {
    const templates = [
      createTemplate(),
      createTemplate({ id: 2, userId: null, name: "Системный" }),
      createTemplate({ id: 3, name: "Интервалы" }),
    ];

    expect(filterTemplates(templates, "", filter).map((template) => template.id)).toEqual(
      expectedIds
    );
  });

  it("ищет без учёта регистра по названию и ключевым фразам", () => {
    const templates = [
      createTemplate(),
      createTemplate({ id: 2, name: "Фартлек", matchPattern: "ускорения" }),
    ];

    expect(filterTemplates(templates, "ТЕМП", "all")).toEqual([templates[0]]);
    expect(filterTemplates(templates, "УСКОРЕНИЯ", "all")).toEqual([templates[1]]);
  });

  it("строит ссылку редактирования", () => {
    expect(getTemplateEditPath(42)).toBe("/tools/templates/42");
  });
});
