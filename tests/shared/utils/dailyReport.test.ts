import { describe, expect, it } from "vitest";
import { buildDailyReportText, type DailyReportDayData } from "@/shared/utils/dailyReport";

describe("shared/utils/dailyReport", () => {
  it("должен возвращать пустую строку, когда day отсутствует", () => {
    expect(
      buildDailyReportText({
        date: "2026-02-09",
        day: null,
      })
    ).toBe("");
  });

  it("должен формировать отчет в формате дневника за день", () => {
    const day: DailyReportDayData = {
      planEntries: [
        {
          id: 1,
          taskText: "<b>Легкий бег 10 км</b>",
        },
      ],
      workoutReports: [
        {
          planEntryId: 1,
          startTime: "07:15",
          resultText: "10 км за 48:00",
          commentText: "Пульс ровный",
          overallScore: 8,
          functionalScore: 7,
          muscleScore: 6,
          weather: "sunny",
          hasWind: true,
          temperatureC: "-2.34",
          surface: "asphalt",
          shoes: [{ id: 10, name: "Pegasus" }],
        },
      ],
      weightEntries: [{ period: "morning", weightKg: "70.4" }],
      recoveryEntry: {
        hasBath: true,
        hasMfr: false,
        hasMassage: true,
        sleepHours: "7.5",
      },
      status: {
        totalDistanceKm: 10,
      },
      previousEveningWeightKg: "70.8",
    };

    const report = buildDailyReportText({
      date: "2026-02-09",
      day,
    });

    expect(report).toBe(
      [
        "09.02.2026(Пн)",
        "",
        "Легкий бег 10 км",
        "",
        "07:15",
        "",
        "10 км за 48:00",
        "",
        "Пульс ровный. -2.3°C. Солнечно. Ветер. Асфальт. Pegasus",
        "",
        "8-7-6",
        "",
        "07:30",
        "",
        "70.8; 70.4",
        "",
        "Баня, Массаж",
        "",
        "10.00 км",
      ].join("\n")
    );
  });

  it("должен подставлять прочерки при незаполненных данных", () => {
    const day: DailyReportDayData = {
      planEntries: [
        {
          id: 1,
          taskText: "Интервалы",
        },
      ],
      workoutReports: [],
      weightEntries: [],
      recoveryEntry: {
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        sleepHours: null,
      },
      status: {
        totalDistanceKm: 0,
      },
      previousEveningWeightKg: null,
    };

    const report = buildDailyReportText({
      date: "2026-02-10",
      day,
    });

    expect(report).toContain("10.02.2026(Вт)");
    expect(report).toContain("Интервалы");
    expect(report.match(/^-$/gm)).toHaveLength(6);
  });
});
