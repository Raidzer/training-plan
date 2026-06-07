import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatNumberedLines,
  formatScore,
  formatSleepTimeValue,
  formatWeightValue,
  getMonthRange,
  isValidDateString,
  joinValues,
  normalizeStartTimeInput,
  parseDate,
  parseSleepTimeInput,
  toDefaultWorkoutForm,
} from "@/app/diary/DiaryClient/utils/diaryUtils";
import type { WorkoutReport } from "@/app/diary/DiaryClient/types/diaryTypes";

describe("DiaryClient diaryUtils", () => {
  it("должен форматировать и парсить даты дневника", () => {
    const date = dayjs("2026-05-10");

    expect(formatDate(date)).toBe("2026-05-10");
    expect(parseDate("2026-05-10").format("YYYY-MM-DD")).toBe("2026-05-10");
    expect(getMonthRange(date)).toEqual({
      from: "2026-05-01",
      to: "2026-05-31",
    });
    expect(isValidDateString("2026-05-10")).toBe(true);
    expect(isValidDateString("10.05.2026")).toBe(false);
    expect(isValidDateString(null)).toBe(false);
  });

  it("должен строить форму тренировки из отчета и fallback-значений", () => {
    const report: WorkoutReport = {
      id: 10,
      planEntryId: 1,
      date: "2026-05-10",
      startTime: "09:00",
      resultText: "10 км",
      commentText: null,
      distanceKm: "10.5",
      overallScore: 8,
      functionalScore: null,
      muscleScore: 7,
      weather: "sunny",
      hasWind: false,
      temperatureC: "18",
      surface: "asphalt",
      shoes: [
        { id: 3, name: "Pegasus", mileageKm: "120.50" },
        { id: 4, name: "Streak", mileageKm: null },
      ],
    };

    expect(toDefaultWorkoutForm(report)).toMatchObject({
      startTime: "09:00",
      resultText: "10 км",
      commentText: "",
      distanceKm: "10.5",
      overallScore: 8,
      functionalScore: null,
      muscleScore: 7,
      weather: "sunny",
      hasWind: "false",
      temperatureC: "18",
      surface: "asphalt",
      shoeIds: [3, 4],
      shoeMileageKm: {
        3: "120.5",
        4: "",
      },
    });
    expect(toDefaultWorkoutForm({ ...report, hasWind: true }).hasWind).toBe("true");
    expect(toDefaultWorkoutForm(null)).toMatchObject({
      startTime: "",
      resultText: "",
      hasWind: "",
      shoeIds: [],
      shoeMileageKm: {},
    });
  });

  it("должен нормализовать время старта и сна", () => {
    expect(normalizeStartTimeInput("7")).toBe("7");
    expect(normalizeStartTimeInput("730")).toBe("07:30");
    expect(normalizeStartTimeInput("245")).toBe("02:45");
    expect(normalizeStartTimeInput("1234")).toBe("12:34");
    expect(formatSleepTimeValue(null)).toBe("");
    expect(formatSleepTimeValue("7.5")).toBe("07:30");
    expect(formatSleepTimeValue("24.7")).toBe("24:00");
    expect(formatSleepTimeValue("-1")).toBe("00:00");
    expect(formatSleepTimeValue("bad")).toBe("");
    expect(parseSleepTimeInput("")).toEqual({ normalized: "", value: null, valid: true });
    expect(parseSleepTimeInput("2401")).toEqual({
      normalized: "24:01",
      value: null,
      valid: false,
    });
    expect(parseSleepTimeInput("2400")).toEqual({ normalized: "24:00", value: 24, valid: true });
    expect(parseSleepTimeInput("bad")).toEqual({ normalized: "", value: null, valid: true });
  });

  it("должен форматировать вес, списки и оценки", () => {
    expect(formatWeightValue(null)).toBe("");
    expect(formatWeightValue("70,44")).toBe("70.4");
    expect(formatWeightValue("bad")).toBe("");
    expect(joinValues(["  A  ", "", null, "B"])).toBe("A; B");
    expect(joinValues([])).toBe("");
    expect(joinValues([" ", null])).toBe("");
    expect(formatNumberedLines([], { emptyValue: "нет", includeIfAllEmpty: true })).toBe("нет");
    expect(formatNumberedLines(["A", "", null])).toBe("1) A\n2) -\n3) -");
    expect(formatNumberedLines(["", null])).toBe("");
    expect(formatScore(null)).toBe("");
    expect(
      formatScore({
        date: "2026-05-10",
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        overallScore: 8,
        functionalScore: null,
        muscleScore: 6,
        sleepHours: null,
      })
    ).toBe("8-6");
  });
});
