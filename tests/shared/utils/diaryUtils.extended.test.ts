import { describe, expect, it } from "vitest";
import {
  buildDateRange,
  buildDayStatus,
  formatDateWithDay,
  formatNumberedLines,
  formatRecovery,
  formatSleep,
  formatTemperatureValue,
  formatWeight,
  formatWorkoutScore,
  hasSleepHours,
  hasReportableWorkoutTask,
  shiftDate,
} from "@/shared/utils/diaryUtils";

describe("shared/utils/diaryUtils (extended)", () => {
  it("должен отличать реальное задание тренировки от пустого плейсхолдера", () => {
    expect(hasReportableWorkoutTask("-")).toBe(false);
    expect(hasReportableWorkoutTask(" — ")).toBe(false);
    expect(hasReportableWorkoutTask("<span>-</span>")).toBe(false);
    expect(hasReportableWorkoutTask("Кросс 8 км")).toBe(true);
  });

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
      hasSleep: true,
      totalDistanceKm: 12.5,
    });

    expect(status).toEqual({
      date: "2026-02-09",
      hasWeightMorning: true,
      hasWeightEvening: true,
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      hasSleep: true,
      totalDistanceKm: 12.5,
      workoutsTotal: 2,
      workoutsWithFullReport: 1,
      dayHasReport: false,
    });
  });

  it("должен учитывать сон в заполненности дня", () => {
    const baseParams = {
      date: "2026-02-10",
      planEntryIds: [],
      fullReportPlanEntryIds: new Set<number>(),
      hasWeightMorning: true,
      hasWeightEvening: true,
      hasBath: false,
      hasMfr: false,
      hasMassage: false,
      totalDistanceKm: 0,
    };

    expect(buildDayStatus({ ...baseParams, hasSleep: true }).dayHasReport).toBe(true);
    expect(buildDayStatus({ ...baseParams, hasSleep: false }).dayHasReport).toBe(false);
    expect(hasSleepHours("07.5")).toBe(true);
    expect(hasSleepHours(null)).toBe(false);
    expect(hasSleepHours("")).toBe(false);
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
    expect(formatSleep({ sleepHours: "8.77", additionalSleepHours: "0.58" })).toBe("08:46+00:35");
    expect(formatNumberedLines(["A", " ", null])).toBe("1) A\n2) -\n3) -");
    expect(
      formatRecovery({
        hasBath: true,
        hasMfr: true,
        hasMassage: false,
        recoveryOther: "Контрастный душ",
      })
    ).toBe("Баня, МФР, Контрастный душ");
    expect(
      formatRecovery({
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        recoveryOther: "  Растяжка  ",
      })
    ).toBe("Растяжка");
  });
});
