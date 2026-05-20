import { describe, expect, it } from "vitest";
import { formatPlanMessage, type PlanEntries } from "@/bot/messages/planMessage";

describe("bot/messages/planMessage", () => {
  it("должен форматировать обычную тренировку с комментарием на отдельных строках", () => {
    const entries: PlanEntries = [
      {
        id: 1,
        date: "2026-04-18",
        sessionOrder: 1,
        taskText: "<b>Легкий бег 10 км</b>",
        commentText: "Стадион",
        isWorkload: false,
      },
    ];

    const message = formatPlanMessage({
      date: "2026-04-18",
      entries,
    });

    expect(message).toBe(
      ["План на 18-04-2026:", "1.", "Легкий бег 10 км", "", "Комментарий:", "Стадион", ""].join(
        "\n"
      )
    );
  });

  it("должен добавлять строку с огнем для нагрузки и не выводить слово нагрузка", () => {
    const entries: PlanEntries = [
      {
        id: 2,
        date: "2026-04-18",
        sessionOrder: 2,
        taskText: "Темповая работа",
        commentText: null,
        isWorkload: true,
      },
    ];

    const message = formatPlanMessage({
      date: "2026-04-18",
      entries,
    });

    expect(message).toBe(["План на 18-04-2026:", "2.", "🔥🔥🔥", "Темповая работа"].join("\n"));
    expect(message).not.toContain("нагрузка");
  });

  it("должен отделять время рассылки пустой строкой", () => {
    const entries: PlanEntries = [
      {
        id: 3,
        date: "2026-04-18",
        sessionOrder: 1,
        taskText: "Кросс 8 км",
        commentText: "Лес",
        isWorkload: false,
      },
    ];

    const message = formatPlanMessage({
      date: "2026-04-18",
      entries,
      sendTime: "08:00",
    });

    expect(message).toBe(
      [
        "План на 18-04-2026:",
        "1.",
        "Кросс 8 км",
        "",
        "Комментарий:",
        "Лес",
        "",
        "",
        "Время рассылки: 08:00.",
      ].join("\n")
    );
  });

  it("должен отделять время рассылки пустой строкой даже если тренировок нет", () => {
    const message = formatPlanMessage({
      date: "2026-04-18",
      entries: [],
      sendTime: "08:00",
    });

    expect(message).toBe(
      ["На 18-04-2026 нет тренировок.", "", "Время рассылки: 08:00."].join("\n")
    );
  });
});
