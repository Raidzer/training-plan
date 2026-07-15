import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { CompetitionBlockCreateForm } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionBlockCreateForm/CompetitionBlockCreateForm";
import { competitionsLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import type { CompetitionBlockFormState } from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";

const form: CompetitionBlockFormState = {
  title: "Весна 2026",
  startDate: dayjs("2026-03-01"),
  endDate: dayjs("2026-06-01"),
};

describe("CompetitionBlockCreateForm", () => {
  it("должен связывать подписи с полями и отправлять semantic form", () => {
    const onSubmit = vi.fn();

    render(
      <CompetitionBlockCreateForm
        form={form}
        error={null}
        validationAttempt={0}
        saving={false}
        disabled={false}
        onChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText(competitionsLabels.blockTitleLabel)).toBeTruthy();
    expect(screen.getByLabelText(competitionsLabels.startDateLabel)).toBeTruthy();
    expect(screen.getByLabelText(competitionsLabels.endDateLabel)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: competitionsLabels.createBlockButton,
      })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("должен связывать ошибку с полем и переводить на него фокус", async () => {
    render(
      <CompetitionBlockCreateForm
        form={{ ...form, title: "" }}
        error={{
          field: "title",
          message: competitionsLabels.blockTitleRequired,
        }}
        validationAttempt={1}
        saving={false}
        disabled={false}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(competitionsLabels.blockTitleLabel);

    await waitFor(() => {
      expect(document.activeElement).toBe(titleInput);
    });

    expect(titleInput.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe(competitionsLabels.blockTitleRequired);
  });
});
