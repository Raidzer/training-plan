import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import type {
  CompetitionBlockItem,
  CompetitionItem,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import {
  addCompetitionToBlock,
  createEmptyBlockForm,
  createEmptyCompetitionForm,
  getBlocksFromResponse,
  removeCompetitionFromBlocks,
  sortCompetitionBlocks,
  updateCompetitionInBlocks,
  validateBlockForm,
  validateCompetitionForm,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/utils/competitionsUtils";

function createCompetition(overrides: Partial<CompetitionItem> = {}): CompetitionItem {
  return {
    id: 1,
    blockId: 10,
    date: "2026-05-10",
    nameLocation: "Московский полумарафон",
    distanceMeters: 21100,
    distanceLabel: "21.1 км",
    priority: COMPETITION_PRIORITIES.MAIN,
    result: null,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createBlock(overrides: Partial<CompetitionBlockItem> = {}): CompetitionBlockItem {
  return {
    id: 10,
    title: "Подготовка",
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    competitions: [],
    ...overrides,
  };
}

describe("competitionsUtils", () => {
  it("должен валидировать блок подготовки и собирать payload", () => {
    const form = createEmptyBlockForm();
    form.title = "  Весна 2026  ";
    form.startDate = dayjs("2026-03-01");
    form.endDate = dayjs("2026-06-01");

    const result = validateBlockForm(form);

    expect(result).toEqual({
      ok: true,
      value: {
        title: "Весна 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
      },
    });
  });

  it("должен отклонять блок с пустым названием или неверным периодом", () => {
    const emptyTitle = validateBlockForm({
      title: " ",
      startDate: dayjs("2026-03-01"),
      endDate: dayjs("2026-06-01"),
    });
    const invalidPeriod = validateBlockForm({
      title: "Весна",
      startDate: dayjs("2026-06-01"),
      endDate: dayjs("2026-03-01"),
    });

    expect(emptyTitle.ok).toBe(false);
    expect(invalidPeriod.ok).toBe(false);
  });

  it("должен валидировать соревнование и сохранять пустой результат как null", () => {
    const form = createEmptyCompetitionForm();
    form.date = dayjs("2026-05-10");
    form.nameLocation = "  Москва  ";
    form.distanceLabel = "  10 км ";
    form.priority = COMPETITION_PRIORITIES.REGULAR;
    form.result = " ";

    const result = validateCompetitionForm(form);

    expect(result).toEqual({
      ok: true,
      value: {
        date: "2026-05-10",
        nameLocation: "Москва",
        distanceLabel: "10 км",
        priority: COMPETITION_PRIORITIES.REGULAR,
        result: null,
      },
    });
  });

  it("должен сортировать блоки и соревнования по датам и порядку", () => {
    const blocks = sortCompetitionBlocks([
      createBlock({ id: 2, startDate: "2026-07-01", sortOrder: 0 }),
      createBlock({
        id: 1,
        startDate: "2026-03-01",
        sortOrder: 0,
        competitions: [
          createCompetition({ id: 2, date: "2026-05-02", sortOrder: 0 }),
          createCompetition({ id: 1, date: "2026-04-01", sortOrder: 0 }),
        ],
      }),
    ]);

    expect(blocks.map((block) => block.id)).toEqual([1, 2]);
    expect(blocks[0].competitions.map((competition) => competition.id)).toEqual([1, 2]);
  });

  it("должен безопасно читать список блоков из API-ответа", () => {
    const block = createBlock();

    expect(getBlocksFromResponse({ blocks: [block] })).toEqual([block]);
    expect(getBlocksFromResponse({ blocks: "bad" })).toEqual([]);
    expect(getBlocksFromResponse(null)).toEqual([]);
  });

  it("должен добавлять, обновлять и удалять соревнование внутри блока", () => {
    const block = createBlock({ competitions: [] });
    const competition = createCompetition({ id: 5, blockId: block.id });
    const withCompetition = addCompetitionToBlock([block], competition);
    const updated = createCompetition({
      id: 5,
      blockId: block.id,
      result: "39:30",
    });
    const withUpdatedCompetition = updateCompetitionInBlocks(withCompetition, updated);
    const withoutCompetition = removeCompetitionFromBlocks(withUpdatedCompetition, 5);

    expect(withCompetition[0].competitions).toEqual([competition]);
    expect(withUpdatedCompetition[0].competitions[0].result).toBe("39:30");
    expect(withoutCompetition[0].competitions).toEqual([]);
  });
});
