import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompetitionListItem } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionListItem/CompetitionListItem";
import { createEmptyCompetitionForm } from "@/app/(protected)/profile/competitions/CompetitionsClient/utils/competitionsUtils";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

describe("CompetitionListItem", () => {
  it.each([
    { result: null, isSkipped: true, expected: "Пропущено" },
    { result: "", isSkipped: true, expected: "Пропущено" },
    { result: "39:30", isSkipped: true, expected: "39:30" },
    { result: null, isSkipped: false, expected: "Не указан" },
    { result: null, isSkipped: undefined, expected: "Не указан" },
  ])(
    "показывает $expected для result=$result и isSkipped=$isSkipped",
    ({ result, isSkipped, expected }) => {
      const competition = {
        id: 10,
        blockId: 1,
        date: "2026-05-10",
        nameLocation: "Москва",
        distanceMeters: 10000,
        distanceLabel: "10 км",
        priority: COMPETITION_PRIORITIES.REGULAR,
        result,
        ...(isSkipped === undefined ? {} : { isSkipped }),
        sortOrder: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      render(
        <ul>
          <CompetitionListItem
            competition={competition}
            isEditing={false}
            editingForm={createEmptyCompetitionForm()}
            editingError={null}
            editingValidationAttempt={0}
            updating={false}
            deleting={false}
            actionsDisabled={false}
            onStartEdit={vi.fn()}
            onChangeEdit={vi.fn()}
            onSaveEdit={vi.fn()}
            onCancelEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </ul>
      );

      expect(screen.getByText(expected, { selector: "dd" })).toBeTruthy();
    }
  );
});
