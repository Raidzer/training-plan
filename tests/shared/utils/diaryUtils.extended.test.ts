import { describe, expect, it } from "vitest";
import {
  buildDateRange,
  buildDayStatus,
  formatDateWithDay,
  formatNumberedLines,
  formatRecovery,
  formatTemperatureValue,
  formatWeight,
  formatWorkoutScore,
  shiftDate,
} from "@/shared/utils/diaryUtils";

describe("shared/utils/diaryUtils (extended)", () => {
  it("должен формировать inclusive дата ranges и shift даты", () => {
    expect(buildDateRange("2026-02-09", "2026-02-11")).toEqual([
      "2026-02-09",
      "2026-02-10",
      "2026-02-11",
    ]);
    expect(shiftDate("2026-02-09", 2)).toBe("2026-02-11");
    expect(shiftDate("bad-date", 2)).toBeNull();
  });

  it("должен вычислять статус дня по полноте отчета и weights", () => {
    const status = buildDayStatus({
      date: "2026-02-09",
      planEntryIds: [1, 2],
      fullReportPlanEntryIds: new Set([1]),
      hasWeightMorning: true,
      hasWeightEvening: true,
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      totalDistanceKm: 12.5,
    });

    expect(status).toEqual({
      date: "2026-02-09",
      hasWeightMorning: true,
      hasWeightEvening: true,
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      totalDistanceKm: 12.5,
      workoutsTotal: 2,
      workoutsWithFullReport: 1,
      dayHasReport: false,
    });
  });

  it("должен форматировать отображаемые поля при exports", () => {
    expect(formatDateWithDay("2026-02-08")).toBe("08.02.2026(Вс)");
    expect(formatTemperatureValue("-3.44")).toBe("-3.4°C");
    expect(formatTemperatureValue(null)).toBe("");
    expect(formatWorkoutScore()).toBe("-");
    expect(
      formatWorkoutScore({
        overallScore: 8,
        functionalScore: null,
        muscleScore: 7,
      })
    ).toBe("8---7");
    expect(formatWeight({ morning: "70.15", evening: "70.2" })).toBe("70.2 / 70.2");
    expect(formatWeight()).toBe("-");
    expect(formatNumberedLines(["A", " ", null])).toBe("1) A\n2) -\n3) -");
    expect(formatRecovery({ hasBath: true, hasMfr: true, hasMassage: false })).toBe("Баня, МФР");
  });
});
