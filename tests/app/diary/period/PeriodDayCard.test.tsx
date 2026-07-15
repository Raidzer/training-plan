import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeriodDayCard } from "@/app/(protected)/diary/period/DiaryPeriodClient/components/PeriodDayCard/PeriodDayCard";
import type { DayStatus } from "@/app/(protected)/diary/period/DiaryPeriodClient/types/periodTypes";

const day: DayStatus = {
  date: "2026-06-01",
  hasWeightMorning: true,
  hasWeightEvening: false,
  hasBath: true,
  hasMfr: false,
  hasMassage: true,
  hasSleep: true,
  workoutsTotal: 2,
  workoutsWithFullReport: 1,
  dayHasReport: true,
  totalDistanceKm: 12.345,
};

describe("PeriodDayCard", () => {
  it("показывает мобильную сводку дня и ссылку на отчёт", () => {
    render(<PeriodDayCard day={day} />);

    const card = screen.getByRole("article");
    expect(
      within(card).getByRole("link", { name: "Открыть отчёт: 01.06.2026" }).getAttribute("href")
    ).toBe("/diary?date=2026-06-01");
    expect(within(card).getByText("У / -")).toBeTruthy();
    expect(within(card).getByText("12.35 км")).toBeTruthy();
    expect(within(card).getByText("Б / - / М")).toBeTruthy();
    expect(within(card).getByText("1/2")).toBeTruthy();
    expect(within(card).getAllByText("Заполнено")).toHaveLength(2);
  });
});
