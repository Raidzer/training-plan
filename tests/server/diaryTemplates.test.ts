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
  const builder: any = {};

  builder.from = vi.fn(() => builder);
  builder.where = vi.fn(() => builder);
  builder.orderBy = vi.fn().mockResolvedValue(rows);
  builder.limit = vi.fn().mockResolvedValue(rows);

  diaryTemplateMocks.dbSelectMock.mockReturnValue(builder);
}

describe("server/diaryTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен получать список и один шаблон", async () => {
    const template = { id: 1, name: "Кросс", keywords: ["кросс"] };
    mockSelectRows([template]);

    await expect(getTemplatesForUser(20)).resolves.toEqual([template]);
    await expect(getTemplateByIdFromDb(1)).resolves.toEqual(template);

    mockSelectRows([]);

    await expect(getTemplateByIdFromDb(2)).resolves.toBeNull();
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
