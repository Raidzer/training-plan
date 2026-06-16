import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { CompetitionCreateForm } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionCreateForm/CompetitionCreateForm";
import {
  COMPETITION_DISTANCE_OPTIONS,
  competitionsLabels,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import type { CompetitionFormState } from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { PERSONAL_RECORD_DISTANCES } from "@/shared/constants/personalRecords.constants";

const createForm = (overrides: Partial<CompetitionFormState> = {}): CompetitionFormState => ({
  date: dayjs("2026-06-15"),
  nameLocation: "Московский полумарафон",
  distanceLabel: "21.1 км",
  priority: COMPETITION_PRIORITIES.REGULAR,
  result: "",
  ...overrides,
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

  it("должен оставлять свободный ввод дистанции", () => {
    const onChange = vi.fn();

    render(
      <CompetitionCreateForm
        form={createForm({ distanceLabel: "" })}
        saving={false}
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );

    const [distanceInput] = screen.getAllByRole("combobox");
    expect(distanceInput).toBeTruthy();
    if (!distanceInput) {
      return;
    }

    fireEvent.change(distanceInput, {
      target: { value: "15 км трейл" },
    });

    expect(onChange).toHaveBeenLastCalledWith("distanceLabel", "15 км трейл");
  });

  it("должен использовать основные дистанции из рекордов как варианты выбора", () => {
    expect(COMPETITION_DISTANCE_OPTIONS.map((option) => option.value)).toEqual(
      PERSONAL_RECORD_DISTANCES.map((distance) => distance.label)
    );
  });
});
