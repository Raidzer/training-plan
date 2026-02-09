import { describe, expect, it } from "vitest";
import { formatSleepTimeValue, parseSleepTimeInput } from "@/bot/utils/sleepTime";

describe("bot/utils/sleepTime", () => {
  it("formatSleepTimeValue должен форматировать и ограничивать значения", () => {
    expect(formatSleepTimeValue(null)).toBe("");
    expect(formatSleepTimeValue("")).toBe("");
    expect(formatSleepTimeValue("7.5")).toBe("07:30");
    expect(formatSleepTimeValue("24.7")).toBe("24:00");
    expect(formatSleepTimeValue("-1")).toBe("00:00");
    expect(formatSleepTimeValue("bad")).toBe("");
  });

  it("parseSleepTimeInput должен нормализовать цифровой ввод и парсить значение", () => {
    expect(parseSleepTimeInput("730")).toEqual({
      normalized: "07:30",
      value: 7.5,
      valid: true,
    });
    expect(parseSleepTimeInput("2359")).toEqual({
      normalized: "23:59",
      value: 23 + 59 / 60,
      valid: true,
    });
  });

  it("parseSleepTimeInput должен проверять невалидный или граничные значения", () => {
    expect(parseSleepTimeInput("24:00")).toEqual({
      normalized: "24:00",
      value: 24,
      valid: true,
    });
    expect(parseSleepTimeInput("24:30")).toEqual({
      normalized: "24:30",
      value: null,
      valid: false,
    });
    expect(parseSleepTimeInput("ab")).toEqual({
      normalized: "",
      value: null,
      valid: true,
    });
  });
});
