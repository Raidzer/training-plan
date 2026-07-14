import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { CompetitionBlockList } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionBlockList/CompetitionBlockList";
import { competitionsLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import type {
  CompetitionBlockEditorController,
  CompetitionBlockItem,
  CompetitionCreatorController,
  CompetitionEditorController,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import {
  createEmptyBlockForm,
  createEmptyCompetitionForm,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/utils/competitionsUtils";

function createControllers() {
  const blockEditor: CompetitionBlockEditorController = {
    editingId: null,
    form: createEmptyBlockForm(),
    error: null,
    validationAttempt: 0,
    updatingId: null,
    deletingId: null,
    onStart: vi.fn(),
    onChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
  };
  const competitionCreator: CompetitionCreatorController = {
    creatingBlockId: null,
    getForm: () => createEmptyCompetitionForm(),
    getError: () => null,
    getValidationAttempt: () => 0,
    onChange: vi.fn(),
    onCreate: vi.fn(() => true),
  };
  const competitionEditor: CompetitionEditorController = {
    editingId: null,
    form: createEmptyCompetitionForm(),
    error: null,
    validationAttempt: 0,
    updatingId: null,
    deletingId: null,
    onStart: vi.fn(),
    onChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
  };

  return { blockEditor, competitionCreator, competitionEditor };
}

describe("CompetitionBlockList", () => {
  it("должен показывать состояние загрузки", () => {
    const controllers = createControllers();

    render(
      <CompetitionBlockList
        blocks={[]}
        loading
        loadError={false}
        collapsedBlockIds={new Set()}
        {...controllers}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("status", { name: competitionsLabels.loadingText })).toBeTruthy();
    expect(
      screen.getByLabelText(
        competitionsLabels.blocksCountShortLabel + ": " + competitionsLabels.overviewLoading
      ).textContent
    ).toBe("—");
  });

  it("должен позволять повторить загрузку после ошибки", () => {
    const controllers = createControllers();
    const onRetry = vi.fn();

    render(
      <CompetitionBlockList
        blocks={[]}
        loading={false}
        loadError
        collapsedBlockIds={new Set()}
        {...controllers}
        onRetry={onRetry}
        onCreateFirst={vi.fn()}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(
      screen.getByLabelText(
        competitionsLabels.blocksCountShortLabel + ": " + competitionsLabels.overviewUnavailable
      ).textContent
    ).toBe("—");
    fireEvent.click(screen.getByRole("button", { name: competitionsLabels.retryButton }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("должен направлять из пустого состояния к созданию блока", () => {
    const controllers = createControllers();
    const onCreateFirst = vi.fn();

    render(
      <CompetitionBlockList
        blocks={[]}
        loading={false}
        loadError={false}
        collapsedBlockIds={new Set()}
        {...controllers}
        onRetry={vi.fn()}
        onCreateFirst={onCreateFirst}
        onToggle={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: competitionsLabels.emptyBlocksAction,
      })
    );
    expect(onCreateFirst).toHaveBeenCalledTimes(1);
  });

  it("должен добавлять название объекта в доступные имена действий", () => {
    const controllers = createControllers();
    const block: CompetitionBlockItem = {
      id: 1,
      title: "Весенний цикл",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      sortOrder: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      competitions: [
        {
          id: 10,
          blockId: 1,
          date: "2026-05-10",
          nameLocation: "Московский полумарафон",
          distanceMeters: 21100,
          distanceLabel: "21.1 км",
          priority: COMPETITION_PRIORITIES.MAIN,
          result: null,
          sortOrder: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    render(
      <CompetitionBlockList
        blocks={[block]}
        loading={false}
        loadError={false}
        collapsedBlockIds={new Set()}
        {...controllers}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onToggle={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: competitionsLabels.collapseBlockAria + ": " + block.title,
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: competitionsLabels.editBlockAria + ": " + block.title,
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: competitionsLabels.editCompetitionAria + ": " + block.competitions[0].nameLocation,
      })
    ).toBeTruthy();
  });

  it("должен блокировать действия блока во время редактирования старта", () => {
    const controllers = createControllers();
    controllers.competitionEditor.editingId = 10;
    const block: CompetitionBlockItem = {
      id: 1,
      title: "Весенний цикл",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      sortOrder: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      competitions: [],
    };

    render(
      <CompetitionBlockList
        blocks={[block]}
        loading={false}
        loadError={false}
        collapsedBlockIds={new Set()}
        {...controllers}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onToggle={vi.fn()}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: competitionsLabels.deleteBlockAria + ": " + block.title,
    }) as HTMLButtonElement;

    expect(deleteButton.disabled).toBe(true);
  });
});
