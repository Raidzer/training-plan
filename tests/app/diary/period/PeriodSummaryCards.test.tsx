import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeriodSummaryCards } from "@/app/(protected)/diary/period/DiaryPeriodClient/components/PeriodSummaryCards/PeriodSummaryCards";

const totals = {
  daysComplete: 4,
  workoutsTotal: 8,
  workoutsWithFullReport: 6,
  weightEntries: 9,
};

describe("PeriodSummaryCards", () => {
  it("показывает значения и контекст сводки", () => {
    render(<PeriodSummaryCards totals={totals} daysCount={7} loading={false} />);

    expect(screen.getByRole("heading", { level: 2, name: "Сводка за период" })).toBeTruthy();
    expect(screen.getByText("Дней заполнено")).toBeTruthy();
    expect(screen.getByText("из 7")).toBeTruthy();
    expect(screen.getByText("Полных отчётов")).toBeTruthy();
    expect(screen.getByText("из 8 тренировок")).toBeTruthy();
    expect(screen.getByText("Тренировок всего")).toBeTruthy();
    expect(screen.getByText("Записей веса")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
  });

  it("обозначает загрузку и скрывает устаревшие значения", () => {
    const { container } = render(
      <PeriodSummaryCards totals={totals} daysCount={7} loading={true} />
    );

    expect(container.querySelector('dl[aria-busy="true"]')).toBeTruthy();
    expect(screen.queryByText("из 7")).toBeNull();
    expect(screen.queryByText("из 8 тренировок")).toBeNull();
    expect(screen.queryByText("9")).toBeNull();
  });
});
