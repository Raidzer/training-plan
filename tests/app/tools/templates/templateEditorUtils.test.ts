import { describe, expect, it } from "vitest";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";
import {
  buildTemplatePayload,
  getTemplateFormInitialValues,
  getTemplateSchema,
  isTemplateCodeValid,
} from "@/app/(protected)/tools/templates/TemplateEditorClient/utils/templateEditorUtils";

function createTemplate(overrides: Partial<DiaryResultTemplate> = {}): DiaryResultTemplate {
  return {
    id: 8,
    userId: 21,
    name: "Пульсовые зоны",
    type: "metric",
    level: "club",
    code: "PULSE",
    matchPattern: "пульс",
    outputTemplate: "{{pulse}}",
    schema: [{ key: "pulse", label: "Пульс", type: "number" }],
    calculations: [{ name: "zone", expression: "pulse / 190" }],
    sortOrder: 17,
    isInline: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("templateEditorUtils", () => {
  it("нормализует ввод и сохраняет служебную метаинформацию редактируемого шаблона", () => {
    const template = createTemplate();

    expect(
      buildTemplatePayload(
        {
          name: "  Пульсовые зоны 2  ",
          code: "  pulse_v2 ",
          matchPattern: "  пульс; зона  ",
          isInline: false,
          schema: [
            {
              key: "  pulse  ",
              label: "  Пульс  ",
              type: "number",
              weight: 1,
            },
          ],
          outputTemplate: "  {{pulse}} уд/мин  ",
        },
        template
      )
    ).toEqual({
      userId: 21,
      name: "Пульсовые зоны 2",
      code: "PULSE_V2",
      matchPattern: "пульс; зона",
      schema: [
        {
          key: "pulse",
          label: "Пульс",
          type: "number",
          weight: 1,
        },
      ],
      outputTemplate: "  {{pulse}} уд/мин  ",
      isInline: false,
      calculations: [{ name: "zone", expression: "pulse / 190" }],
      sortOrder: 17,
      type: "metric",
      level: "club",
    });
  });

  it("задаёт безопасные значения метаданных для нового шаблона", () => {
    expect(
      buildTemplatePayload(
        {
          name: "  Базовый  ",
          code: " ",
          matchPattern: null,
          schema: [],
          outputTemplate: "  Готово  ",
        },
        null
      )
    ).toEqual({
      userId: undefined,
      name: "Базовый",
      code: null,
      matchPattern: null,
      schema: [],
      outputTemplate: "  Готово  ",
      isInline: false,
      calculations: [],
      sortOrder: 0,
      type: "common",
      level: "general",
    });
  });

  it("сохраняет null-владельца и расчёты системного шаблона без подмены", () => {
    const template = createTemplate({ userId: null, calculations: null });

    expect(
      buildTemplatePayload(
        {
          name: template.name,
          code: template.code,
          matchPattern: template.matchPattern,
          schema: getTemplateSchema(template.schema),
          outputTemplate: template.outputTemplate,
        },
        template
      )
    ).toEqual(expect.objectContaining({ userId: null, calculations: null }));
  });

  it("читает только поддерживаемые поля схемы", () => {
    const schema = [
      { key: "time", label: "Время", type: "time" },
      { key: "laps", label: "Отрезки", type: "list", itemType: "time", listSize: 4 },
      { key: "broken", label: "Ошибка", type: "date" },
      null,
      "field",
    ];

    expect(getTemplateSchema(schema)).toEqual(schema.slice(0, 2));
    expect(getTemplateSchema({ schema })).toEqual([]);
  });

  it("подготавливает значения формы без мутации модели", () => {
    const template = createTemplate();

    expect(getTemplateFormInitialValues(template)).toEqual({
      name: "Пульсовые зоны",
      code: "PULSE",
      matchPattern: "пульс",
      isInline: true,
      schema: [{ key: "pulse", label: "Пульс", type: "number" }],
      outputTemplate: "{{pulse}}",
    });
    expect(getTemplateFormInitialValues(null)).toEqual({
      name: "",
      code: null,
      matchPattern: null,
      isInline: false,
      schema: [],
      outputTemplate: "",
    });
  });

  it.each([
    ["PACE", true],
    ["interval_5k", true],
    ["код", false],
    ["with-dash", false],
    ["with space", false],
    ["", false],
  ])("проверяет системный код %s", (code, expectedResult) => {
    expect(isTemplateCodeValid(code)).toBe(expectedResult);
  });
});
