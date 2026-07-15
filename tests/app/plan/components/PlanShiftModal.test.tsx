import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { PlanShiftModal } from "@/app/(protected)/plan/PlanClient/components/PlanShiftModal/PlanShiftModal";
import { PLAN_TEXT } from "@/app/(protected)/plan/PlanClient/constants/planText";
import type { PlanShiftDraft } from "@/app/(protected)/plan/PlanClient/types/planTypes";

const SHIFT_DRAFT: PlanShiftDraft = {
  fromDate: "2026-01-10",
  direction: "forward",
  days: 7,
};

describe("PlanShiftModal", () => {
  it("должен отображать описание и доступные подписи полей", () => {
    render(
      <PlanShiftModal
        open
        draft={SHIFT_DRAFT}
        saving={false}
        dateValue={dayjs(SHIFT_DRAFT.fromDate)}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onDateChange={vi.fn()}
        onDirectionChange={vi.fn()}
        onDaysChange={vi.fn()}
      />
    );

    expect(screen.getByText(PLAN_TEXT.shift.summary(SHIFT_DRAFT.fromDate))).toBeTruthy();
    expect(screen.getByLabelText(PLAN_TEXT.shift.fromDateLabel)).toBeTruthy();
    expect(screen.getByLabelText(PLAN_TEXT.shift.directionLabel)).toBeTruthy();
    expect(screen.getByLabelText(PLAN_TEXT.shift.daysLabel)).toBeTruthy();
  });
});
