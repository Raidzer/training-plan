import dayjs from "dayjs";
import {
  COMPETITION_PRIORITIES,
  MAX_COMPETITION_BLOCK_TITLE_LENGTH,
  MAX_COMPETITION_DISTANCE_LABEL_LENGTH,
  MAX_COMPETITION_NAME_LOCATION_LENGTH,
  MAX_COMPETITION_RESULT_LENGTH,
} from "@/shared/constants/competitions";
import { formatCompetitionDate } from "@/shared/utils/competitionUtils";
import { COMPETITIONS_DATE_FORMAT, competitionsLabels } from "../constants/competitionsConstants";
import type {
  CompetitionBlockFormState,
  CompetitionBlockItem,
  CompetitionBlockPayload,
  CompetitionFormState,
  CompetitionItem,
  CompetitionPayload,
  ValidationResult,
} from "../types/competitionsTypes";

export const createEmptyBlockForm = (): CompetitionBlockFormState => ({
  title: "",
  startDate: dayjs(),
  endDate: dayjs().add(12, "week"),
});

export const createBlockFormFromBlock = (
  block: CompetitionBlockItem
): CompetitionBlockFormState => ({
  title: block.title,
  startDate: dayjs(block.startDate),
  endDate: dayjs(block.endDate),
});

export const createEmptyCompetitionForm = (): CompetitionFormState => ({
  date: dayjs(),
  nameLocation: "",
  distanceLabel: "",
  priority: COMPETITION_PRIORITIES.REGULAR,
  result: "",
});

export const createCompetitionFormFromItem = (item: CompetitionItem): CompetitionFormState => ({
  date: dayjs(item.date),
  nameLocation: item.nameLocation,
  distanceLabel: item.distanceLabel,
  priority: item.priority,
  result: item.result ?? "",
});

export const formatBlockPeriod = (block: CompetitionBlockItem) =>
  `${formatCompetitionDate(block.startDate)} - ${formatCompetitionDate(block.endDate)}`;

export const sortCompetitionBlocks = (blocks: CompetitionBlockItem[]): CompetitionBlockItem[] =>
  blocks
    .map((block) => ({
      ...block,
      competitions: sortCompetitions(block.competitions),
    }))
    .sort((left, right) => {
      const dateCompare = left.startDate.localeCompare(right.startDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const orderCompare = left.sortOrder - right.sortOrder;
      if (orderCompare !== 0) {
        return orderCompare;
      }

      return left.id - right.id;
    });

export const sortCompetitions = (items: CompetitionItem[]): CompetitionItem[] =>
  items.slice().sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    const orderCompare = left.sortOrder - right.sortOrder;
    if (orderCompare !== 0) {
      return orderCompare;
    }

    return left.id - right.id;
  });

export const validateBlockForm = (
  form: CompetitionBlockFormState
): ValidationResult<CompetitionBlockPayload> => {
  const title = form.title.trim();
  if (!title) {
    return { ok: false, error: competitionsLabels.blockTitleRequired };
  }
  if (title.length > MAX_COMPETITION_BLOCK_TITLE_LENGTH) {
    return { ok: false, error: competitionsLabels.blockTitleTooLong };
  }
  if (!form.startDate || !form.endDate) {
    return { ok: false, error: competitionsLabels.blockDateRequired };
  }

  const startDate = form.startDate.format(COMPETITIONS_DATE_FORMAT);
  const endDate = form.endDate.format(COMPETITIONS_DATE_FORMAT);
  if (startDate > endDate) {
    return { ok: false, error: competitionsLabels.blockPeriodInvalid };
  }

  return {
    ok: true,
    value: {
      title,
      startDate,
      endDate,
    },
  };
};

export const validateCompetitionForm = (
  form: CompetitionFormState
): ValidationResult<CompetitionPayload> => {
  if (!form.date) {
    return { ok: false, error: competitionsLabels.competitionDateRequired };
  }

  const nameLocation = form.nameLocation.trim();
  if (!nameLocation) {
    return { ok: false, error: competitionsLabels.nameLocationRequired };
  }
  if (nameLocation.length > MAX_COMPETITION_NAME_LOCATION_LENGTH) {
    return { ok: false, error: competitionsLabels.nameLocationTooLong };
  }

  const distanceLabel = form.distanceLabel.trim();
  if (!distanceLabel) {
    return { ok: false, error: competitionsLabels.distanceRequired };
  }
  if (distanceLabel.length > MAX_COMPETITION_DISTANCE_LABEL_LENGTH) {
    return { ok: false, error: competitionsLabels.distanceTooLong };
  }

  const result = form.result.trim();
  if (result.length > MAX_COMPETITION_RESULT_LENGTH) {
    return { ok: false, error: competitionsLabels.resultTooLong };
  }

  return {
    ok: true,
    value: {
      date: form.date.format(COMPETITIONS_DATE_FORMAT),
      nameLocation,
      distanceLabel,
      priority: form.priority,
      result: result || null,
    },
  };
};

export const getBlocksFromResponse = (data: unknown): CompetitionBlockItem[] => {
  if (!data || typeof data !== "object") {
    return [];
  }

  const blocksValue = (data as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocksValue)) {
    return [];
  }

  return sortCompetitionBlocks(blocksValue as CompetitionBlockItem[]);
};

export const getBlockFromResponse = (data: unknown): CompetitionBlockItem | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const blockValue = (data as { block?: unknown }).block;
  if (!blockValue || typeof blockValue !== "object") {
    return null;
  }

  return blockValue as CompetitionBlockItem;
};

export const getCompetitionFromResponse = (data: unknown): CompetitionItem | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const competitionValue = (data as { competition?: unknown }).competition;
  if (!competitionValue || typeof competitionValue !== "object") {
    return null;
  }

  return competitionValue as CompetitionItem;
};

export const upsertBlock = (
  blocks: CompetitionBlockItem[],
  block: CompetitionBlockItem
): CompetitionBlockItem[] =>
  sortCompetitionBlocks([block, ...blocks.filter((item) => item.id !== block.id)]);

export const addCompetitionToBlock = (
  blocks: CompetitionBlockItem[],
  competition: CompetitionItem
): CompetitionBlockItem[] =>
  sortCompetitionBlocks(
    blocks.map((block) => {
      if (block.id !== competition.blockId) {
        return block;
      }

      return {
        ...block,
        competitions: sortCompetitions([
          competition,
          ...block.competitions.filter((item) => item.id !== competition.id),
        ]),
      };
    })
  );

export const updateCompetitionInBlocks = (
  blocks: CompetitionBlockItem[],
  competition: CompetitionItem
): CompetitionBlockItem[] =>
  sortCompetitionBlocks(
    blocks.map((block) => {
      if (block.id !== competition.blockId) {
        return block;
      }

      return {
        ...block,
        competitions: sortCompetitions(
          block.competitions.map((item) => {
            if (item.id === competition.id) {
              return competition;
            }

            return item;
          })
        ),
      };
    })
  );

export const removeCompetitionFromBlocks = (
  blocks: CompetitionBlockItem[],
  competitionId: number
): CompetitionBlockItem[] =>
  blocks.map((block) => ({
    ...block,
    competitions: block.competitions.filter((item) => item.id !== competitionId),
  }));
