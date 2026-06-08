import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeriodTable } from "@/app/(protected)/diary/period/DiaryPeriodClient/components/PeriodTable/PeriodTable";
import type { DayStatus } from "@/app/(protected)/diary/period/DiaryPeriodClient/types/periodTypes";

function createDay(overrides: Partial<DayStatus> = {}): DayStatus {
  return {
    date: "2026-06-01",
    hasWeightMorning: true,
    hasWeightEvening: false,
    hasBath: true,
    hasMfr: false,
    hasMassage: true,
    workoutsTotal: 2,
    workoutsWithFullReport: 1,
    dayHasReport: true,
    totalDistanceKm: 12.345,
    ...overrides,
  };
}

describe("PeriodTable", () => {
  it("рендерит статусы дней и fallback для незаполненного отчета", () => {
    render(
      <PeriodTable
        loading={false}
        days={[
          createDay(),
          createDay({
            date: "2026-06-02",
            hasWeightMorning: false,
            hasWeightEvening: true,
            hasBath: false,
            hasMfr: true,
            hasMassage: false,
            workoutsTotal: 0,
            workoutsWithFullReport: 0,
            dayHasReport: false,
            totalDistanceKm: 0,
          }),
        ]}
      />
    );

    expect(screen.getByText("01.06.2026")).toBeTruthy();
    expect(screen.getByText("У / -")).toBeTruthy();
    expect(screen.getByText("12.35")).toBeTruthy();
    expect(screen.getByText("Б / - / М")).toBeTruthy();
    expect(screen.getByText("1/2")).toBeTruthy();
    expect(screen.getByText("Заполнено")).toBeTruthy();
    expect(screen.getByText("02.06.2026")).toBeTruthy();
    expect(screen.getByText("- / В")).toBeTruthy();
    expect(screen.getByText("- / МФР / -")).toBeTruthy();
    expect(screen.getByText("Не заполнено")).toBeTruthy();
  });
});
