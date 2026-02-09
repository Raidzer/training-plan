import { describe, expect, it } from "vitest";
import {
  addDaysToIsoDate,
  formatDateForDisplay,
  formatDateInTimeZone,
  formatDateLocal,
  getNextIsoDates,
  getWeekdayShortRu,
  getZonedDateTime,
  isValidTimeZone,
  normalizeDateValue,
  offsetToIanaTimeZone,
  parseDisplayDate,
  parseTimeZoneOffset,
  resolveTimeZoneInput,
} from "@/bot/utils/dateTime";

describe("bot/utils/dateTime", () => {
  it("formatDateLocal должен возвращать YYYY-MM-DD", () => {
    const result = formatDateLocal(new Date("2026-02-09T15:30:00.000Z"));

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formatDateInTimeZone должен возвращать отформатированную строку даты", () => {
    const result = formatDateInTimeZone(new Date("2026-02-09T15:30:00.000Z"), "Etc/UTC");

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getZonedDateTime должен возвращать части даты и времени", () => {
    const result = getZonedDateTime(new Date("2026-02-09T05:40:00.000Z"), "Etc/UTC");

    expect(result).toEqual({
      date: "2026-02-09",
      time: "05:40",
    });
  });

  it("хелперы часового пояса должны парсить смещение и определять IANA-ввод", () => {
    expect(isValidTimeZone("Europe/Moscow")).toBe(true);
    expect(isValidTimeZone("Bad/Zone")).toBe(false);

    expect(parseTimeZoneOffset("UTC+3")).toBe(3);
    expect(parseTimeZoneOffset("GMT-5")).toBe(-5);
    expect(parseTimeZoneOffset("bad")).toBeNull();

    expect(offsetToIanaTimeZone(3)).toBe("Etc/GMT-3");
    expect(offsetToIanaTimeZone(-5)).toBe("Etc/GMT+5");
    expect(offsetToIanaTimeZone(99)).toBeNull();

    expect(resolveTimeZoneInput("Europe/Moscow")).toEqual({
      timeZone: "Europe/Moscow",
      type: "iana",
    });
    expect(resolveTimeZoneInput("UTC+3")).toEqual({
      timeZone: "Etc/GMT-3",
      type: "offset",
      offset: 3,
    });
  });

  it("хелперы преобразования дат должны форматировать и парсить отображаемые даты", () => {
    expect(formatDateForDisplay("2026-02-09")).toBe("09-02-2026");
    expect(parseDisplayDate("09-02-2026")).toBe("2026-02-09");
    expect(parseDisplayDate("invalid")).toBeNull();
  });

  it("хелперы последовательности дат должны добавлять дни и возвращать дни недели", () => {
    expect(addDaysToIsoDate("2026-02-09", 1)).toBe("2026-02-10");
    expect(addDaysToIsoDate("bad-date", 1)).toBe("bad-date");

    expect(getNextIsoDates("2026-02-09", 3)).toEqual(["2026-02-10", "2026-02-11", "2026-02-12"]);
    expect(getWeekdayShortRu("2026-02-08")).toBe("Вс");
    expect(getWeekdayShortRu("bad-date")).toBe("");
  });

  it("normalizeDateValue должен обрабатывать null, строку и дату", () => {
    expect(normalizeDateValue(null)).toBeNull();
    expect(normalizeDateValue("2026-02-09")).toBe("2026-02-09");
    expect(normalizeDateValue(new Date("2026-02-09T15:30:00.000Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
