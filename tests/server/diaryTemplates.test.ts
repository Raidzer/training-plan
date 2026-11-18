import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const diaryTemplateMocks = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
  dbInsertMock: vi.fn(),
  dbUpdateMock: vi.fn(),
  dbDeleteMock: vi.fn(),
  matchTemplatesMock: vi.fn(),
  matchTemplatesWithDetailsMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  db: {
    select: diaryTemplateMocks.dbSelectMock,
    insert: diaryTemplateMocks.dbInsertMock,
    update: diaryTemplateMocks.dbUpdateMock,
    delete: diaryTemplateMocks.dbDeleteMock,
  },
}));

vi.mock("@/shared/utils/templateMatching", () => ({
  matchTemplates: diaryTemplateMocks.matchTemplatesMock,
  matchTemplatesWithDetails: diaryTemplateMocks.matchTemplatesWithDetailsMock,
}));

import {
  createTemplateInDb,
  deleteTemplateInDb,
  findMatchingTemplates,
  findMatchingTemplatesWithDetails,
  getTemplateByIdFromDb,
  getTemplatesForUser,
  updateTemplateInDb,
} from "@/server/diaryTemplates";

function mockSelectRows(rows: unknown[]) {
  const where = vi.fn((_condition: Parameters<PgDialect["sqlToQuery"]>[0]) => ({
    orderBy: vi.fn().mockResolvedValue(rows),
    limit: vi.fn().mockResolvedValue(rows),
  }));
  diaryTemplateMocks.dbSelectMock.mockReturnValue({ from: vi.fn(() => ({ where })) });
  return where;
}

describe("server/diaryTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен получать список глобальных и собственных шаблонов", async () => {
    const template = { id: 1, name: "Кросс", keywords: ["кросс"] };
    const where = mockSelectRows([template]);

    await expect(getTemplatesForUser(20)).resolves.toEqual([template]);

    expect(new PgDialect().sqlToQuery(where.mock.calls[0][0])).toMatchObject({
      sql: '("diary_result_templates"."user_id" is null or "diary_result_templates"."user_id" = $1)',
      params: [20],
    });
  });

  it("должен ограничивать чтение по ID глобальными и собственными шаблонами", async () => {
    const template = { id: 1, name: "Кросс", userId: 20 };
    const where = mockSelectRows([template]);

    await expect(getTemplateByIdFromDb(1, 20)).resolves.toEqual(template);

    expect(new PgDialect().sqlToQuery(where.mock.calls[0][0])).toMatchObject({
      sql:
        '("diary_result_templates"."id" = $1 and ' +
        '("diary_result_templates"."user_id" is null or "diary_result_templates"."user_id" = $2))',
      params: [1, 20],
    });
  });

  it("должен возвращать null, если запрос не находит доступный шаблон", async () => {
    mockSelectRows([]);

    await expect(getTemplateByIdFromDb(2, 20)).resolves.toBeNull();
  });

  it("должен создавать, обновлять и удалять шаблоны", async () => {
    const returningMock = vi.fn().mockResolvedValue([{ id: 5 }]);
    const valuesMock = vi.fn(() => ({
      returning: returningMock,
    }));
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);

    diaryTemplateMocks.dbInsertMock.mockReturnValue({ values: valuesMock });
    diaryTemplateMocks.dbUpdateMock.mockReturnValue({
      set: vi.fn(() => ({
        where: updateWhereMock,
      })),
    });
    diaryTemplateMocks.dbDeleteMock.mockReturnValue({
      where: deleteWhereMock,
    });

    await expect(createTemplateInDb({ name: "Темп" } as any)).resolves.toBe(5);
    await updateTemplateInDb(5, { name: "Темповая" } as any);
    await deleteTemplateInDb(5);

    expect(updateWhereMock).toHaveBeenCalled();
    expect(deleteWhereMock).toHaveBeenCalled();
  });

  it("должен искать подходящие шаблоны", async () => {
    const templates = [{ id: 1, name: "Кросс" }];
    const matches = [{ id: 1, name: "Кросс" }];
    const detailedMatches = [{ template: templates[0], score: 1 }];

    mockSelectRows(templates);
    diaryTemplateMocks.matchTemplatesMock.mockReturnValue(matches);
    diaryTemplateMocks.matchTemplatesWithDetailsMock.mockReturnValue(detailedMatches);

    await expect(findMatchingTemplates(20, "кросс 10 км")).resolves.toEqual(matches);
    await expect(findMatchingTemplatesWithDetails(20, "кросс 10 км")).resolves.toEqual(
      detailedMatches
    );
  });
});
