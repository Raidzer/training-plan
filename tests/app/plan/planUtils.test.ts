import { describe, expect, it } from "vitest";
import {
  buildPlanDays,
  formatDateWithWeekday,
  getPlanDateParts,
} from "@/app/(protected)/plan/PlanClient/utils/planUtils";
import type { PlanEntry } from "@/app/(protected)/plan/PlanClient/types/planTypes";

function createPlanEntry(overrides: Partial<PlanEntry> = {}): PlanEntry {
  return {
    id: 1,
    date: "2023-10-01",
    sessionOrder: 1,
    taskText: "Run",
    commentText: null,
    importId: null,
    isWorkload: false,
    hasReport: false,
    ...overrides,
  };
}

describe("formatDateWithWeekday", () => {
  it("возвращает дату с днем недели на русском", () => {
    expect(formatDateWithWeekday("2023-10-01")).toBe("2023-10-01 (Вс)");
    expect(formatDateWithWeekday("2023-10-02")).toBe("2023-10-02 (Пн)");
    expect(formatDateWithWeekday("2023-10-07")).toBe("2023-10-07 (Сб)");
  });

  it("возвращает части даты для карточки и индекс дня от понедельника", () => {
    expect(getPlanDateParts("2023-10-01")).toEqual({
      dateLabel: "1 октября",
      yearLabel: "2023",
      weekdayLabel: "Воскресенье",
      shortWeekdayLabel: "Вс",
      weekdayIndex: 6,
    });
  });
});

describe("buildPlanDays", () => {
  it("группирует записи и сохраняет структуру тренировок по порядку", () => {
    const entries: PlanEntry[] = [
      createPlanEntry({
        id: 2,
        sessionOrder: 2,
        taskText: "Stretch",
        hasReport: true,
      }),
      createPlanEntry({
        id: 1,
        sessionOrder: 1,
        taskText: "Run",
        commentText: "Easy",
        isWorkload: true,
      }),
      createPlanEntry({
        id: 3,
        date: "2023-10-02",
        taskText: "Rest",
        hasReport: true,
      }),
    ];

    const result = buildPlanDays(entries);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: "2023-10-01",
      isWorkload: true,
      hasAnyReport: true,
      hasAllReports: false,
      reportedWorkoutCount: 1,
      workoutCount: 2,
    });
    expect(result[0].workouts.map((workout) => workout.id)).toEqual([1, 2]);
    expect(result[0].workouts[0]).toMatchObject({
      taskText: "Run",
      commentText: "Easy",
      hasReport: false,
    });

    expect(result[1]).toMatchObject({
      date: "2023-10-02",
      hasAnyReport: true,
      hasAllReports: true,
      reportedWorkoutCount: 1,
      workoutCount: 1,
    });
  });

  it("различает частично и полностью заполненный день", () => {
    const result = buildPlanDays([
      createPlanEntry({ id: 1, hasReport: true }),
      createPlanEntry({ id: 2, sessionOrder: 2, hasReport: false }),
    ]);

    expect(result[0].hasAnyReport).toBe(true);
    expect(result[0].hasAllReports).toBe(false);
    expect(result[0].reportedWorkoutCount).toBe(1);
  });

  it("не считает строку-заполнитель тренировкой", () => {
    const result = buildPlanDays([
      createPlanEntry({
        taskText: "-",
        commentText: "-",
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      workouts: [],
      hasAnyReport: false,
      hasAllReports: true,
      reportedWorkoutCount: 0,
      workoutCount: 0,
    });
  });
});
