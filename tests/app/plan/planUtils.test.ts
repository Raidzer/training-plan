import { describe, it, expect } from "vitest";
import { formatDateWithWeekday, buildPlanDays, type PlanEntry } from "@/app/plan/planUtils";

describe("formatDateWithWeekday", () => {
  it("должен возвращать дату с днем недели на русском", () => {
    expect(formatDateWithWeekday("2023-10-01")).toBe("2023-10-01 (Вс)");
    expect(formatDateWithWeekday("2023-10-02")).toBe("2023-10-02 (Пн)");
    expect(formatDateWithWeekday("2023-10-03")).toBe("2023-10-03 (Вт)");
    expect(formatDateWithWeekday("2023-10-04")).toBe("2023-10-04 (Ср)");
    expect(formatDateWithWeekday("2023-10-05")).toBe("2023-10-05 (Чт)");
    expect(formatDateWithWeekday("2023-10-06")).toBe("2023-10-06 (Пт)");
    expect(formatDateWithWeekday("2023-10-07")).toBe("2023-10-07 (Сб)");
  });

  it("должен корректно работать с корректной датой", () => {
    expect(formatDateWithWeekday("2026-01-17")).toBe("2026-01-17 (Сб)");
  });
});

describe("buildPlanDays", () => {
  it("должен группировать записи по дням", () => {
    const entries: PlanEntry[] = [
      {
        id: 1,
        date: "2023-10-01",
        sessionOrder: 1,
        taskText: "Run",
        commentText: "Easy",
        importId: null,
        isWorkload: true,
        hasReport: false,
      },
      {
        id: 2,
        date: "2023-10-01",
        sessionOrder: 2,
        taskText: "Stretch",
        commentText: null,
        importId: null,
        isWorkload: false,
        hasReport: true,
      },
      {
        id: 3,
        date: "2023-10-02",
        sessionOrder: 1,
        taskText: "Rest",
        commentText: null,
        importId: null,
        isWorkload: false,
        hasReport: true,
      },
    ];

    const result = buildPlanDays(entries);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2023-10-01");
    expect(result[0].taskText).toContain("1) Run");
    expect(result[0].taskText).toContain("2) Stretch");
    expect(result[0].isWorkload).toBe(true);
    expect(result[0].hasReport).toBe(false);

    expect(result[1].date).toBe("2023-10-02");
    expect(result[1].taskText).toBe("Rest");
    expect(result[1].hasReport).toBe(true);
  });
});
