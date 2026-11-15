import { describe, expect, it } from "vitest";
import {
  buildPlanCalendarWidgetPayload,
  createCalendarWidgetState,
  isValidCalendarDate,
  isValidCalendarMonth,
} from "@/bot/messages/planCalendarWidget";

describe("bot/messages/planCalendarWidget", () => {
  it("строит календарь с отмеченными датами и данными Telegram Widget", () => {
    const payload = buildPlanCalendarWidgetPayload({
      chatId: 42,
      month: "2026-11",
      planDates: ["2026-11-02", "2026-11-15"],
    });

    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({
      chat_id: 42,
      allow_queries: true,
      height: 520,
    });
    expect(payload?.html).toContain("2026-11");
    expect(payload?.html).toContain("Есть тренировка");
    expect(JSON.parse(payload?.chat_data ?? "{}")).toEqual(
      createCalendarWidgetState({
        month: "2026-11",
        planDates: ["2026-11-02", "2026-11-15"],
      })
    );
  });

  it("проверяет месяц и календарную дату перед запросом к API", () => {
    expect(isValidCalendarMonth("2026-11")).toBe(true);
    expect(isValidCalendarMonth("2026-13")).toBe(false);
    expect(isValidCalendarDate("2026-11-30")).toBe(true);
    expect(isValidCalendarDate("2026-02-30")).toBe(false);
  });
});
