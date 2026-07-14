import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const renderForm = (
  overrides: Partial<React.ComponentProps<typeof CompetitionCreateForm>> = {}
) => {
  const onChange = vi.fn();
  const onSubmit = vi.fn();

  render(
    <CompetitionCreateForm
      idPrefix="competition-create-test"
      form={createForm()}
      saving={false}
      onChange={onChange}
      onSubmit={onSubmit}
      {...overrides}
    />
  );

  return { onChange, onSubmit };
};

describe("CompetitionCreateForm", () => {
  it("должен вводить результат через общий форматтер времени", () => {
    const { onChange } = renderForm();

    fireEvent.change(screen.getByPlaceholderText(competitionsLabels.resultPlaceholder), {
      target: { value: "1234" },
    });

    expect(onChange).toHaveBeenLastCalledWith("result", "12:34");
  });

  it("должен оставлять свободный ввод дистанции", () => {
    const { onChange } = renderForm({
      form: createForm({ distanceLabel: "" }),
    });

    const distanceInput = screen.getByLabelText(competitionsLabels.distanceLabel);

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

  it("должен связывать видимые подписи со всеми полями и отправлять форму", () => {
    const { onSubmit } = renderForm();

    expect(screen.getByLabelText(competitionsLabels.competitionDateLabel)).toBeTruthy();
    expect(screen.getByLabelText(competitionsLabels.nameLocationLabel)).toBeTruthy();
    expect(screen.getByLabelText(competitionsLabels.distanceLabel)).toBeTruthy();
    expect(screen.getByLabelText(competitionsLabels.priorityLabel)).toBeTruthy();
    expect(screen.getByLabelText(competitionsLabels.resultLabel)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: competitionsLabels.addCompetitionButton,
      })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("должен показывать inline-ошибку и фокусировать поле", async () => {
    renderForm({
      form: createForm({ nameLocation: "" }),
      error: {
        field: "nameLocation",
        message: competitionsLabels.nameLocationRequired,
      },
      validationAttempt: 1,
    });

    const nameInput = screen.getByLabelText(competitionsLabels.nameLocationLabel);

    await waitFor(() => {
      expect(document.activeElement).toBe(nameInput);
    });

    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe(competitionsLabels.nameLocationRequired);
  });

  it("должен блокировать повторную отправку во время сохранения", () => {
    renderForm({ saving: true });

    const nameInput = screen.getByLabelText(
      competitionsLabels.nameLocationLabel
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: competitionsLabels.addCompetitionButton,
    }) as HTMLButtonElement;

    expect(nameInput.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });
});
