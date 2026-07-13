import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { PlanEditorModal } from "@/app/(protected)/plan/PlanClient/components/PlanEditorModal/PlanEditorModal";
import { PLAN_TEXT } from "@/app/(protected)/plan/PlanClient/constants/planText";
import type { PlanDraft } from "@/app/(protected)/plan/PlanClient/types/planTypes";

const createDraft = (overrides: Partial<PlanDraft> = {}): PlanDraft => ({
  date: "2026-01-10",
  originalDate: "2026-01-10",
  isWorkload: false,
  entries: [
    {
      id: 1,
      taskText: "Run",
      commentText: "",
      hasReport: true,
    },
  ],
  ...overrides,
});

describe("PlanEditorModal", () => {
  it("должен блокировать поле даты, если по дню есть отчет", () => {
    render(
      <PlanEditorModal
        open
        draft={createDraft()}
        saving={false}
        dateValue={dayjs("2026-01-10")}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onDateChange={vi.fn()}
        onWorkloadChange={vi.fn()}
        onEntryChange={vi.fn()}
        onAddEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onDeleteDay={vi.fn()}
      />
    );

    const dateInput = screen.getByLabelText(PLAN_TEXT.editor.dateLabel) as HTMLInputElement;

    expect(screen.getByText(PLAN_TEXT.editor.dateLockedByReport)).toBeTruthy();
    expect(dateInput.disabled).toBe(true);
    expect(screen.getByLabelText(PLAN_TEXT.editor.taskLabel)).toBeTruthy();
    expect(screen.getByLabelText(PLAN_TEXT.editor.commentLabel)).toBeTruthy();
    expect(screen.getByLabelText(PLAN_TEXT.editor.deleteWorkoutAria(1))).toBeTruthy();
  });
});
