import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { CompetitionCreateForm } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionCreateForm/CompetitionCreateForm";
import { competitionsLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import type { CompetitionFormState } from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

const createForm = (): CompetitionFormState => ({
  date: dayjs("2026-06-15"),
  nameLocation: "Московский полумарафон",
  distanceLabel: "21.1 км",
  priority: COMPETITION_PRIORITIES.REGULAR,
  result: "",
});

describe("CompetitionCreateForm", () => {
  it("должен вводить результат через общий форматтер времени", () => {
    const onChange = vi.fn();

    render(
      <CompetitionCreateForm
        form={createForm()}
        saving={false}
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(competitionsLabels.resultPlaceholder), {
      target: { value: "1234" },
    });

    expect(onChange).toHaveBeenLastCalledWith("result", "12:34");
  });
});
