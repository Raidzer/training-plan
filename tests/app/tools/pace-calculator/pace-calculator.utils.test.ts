import { describe, expect, it } from "vitest";
import {
  formatMinutesSeconds,
  formatTime,
  getCeilSeconds,
  getDistanceLabel,
  parseTimeInputToSeconds,
  safeParseSaved,
  toNonNegativeInt,
} from "@/app/tools/pace-calculator/pace-calculator.utils";

describe("app/tools/pace-calculator.utils", () => {
  it("должен парсить неотрицательные целые числа", () => {
    expect(toNonNegativeInt("42")).toBe(42);
    expect(toNonNegativeInt("-5")).toBe(0);
    expect(toNonNegativeInt("bad")).toBe(0);
  });

  it("должен нормализовать секунды и форматировать время", () => {
    expect(getCeilSeconds(10.1)).toBe(11);
    expect(getCeilSeconds(-1)).toBe(0);
    expect(formatTime(3723)).toBe("01:02:03");
    expect(formatMinutesSeconds(125)).toBe("2:05");
  });

  it("должен парсить значения ввода времени", () => {
    expect(parseTimeInputToSeconds("01:02:03")).toBe(3723);
    expect(parseTimeInputToSeconds("05:30")).toBe(330);
    expect(parseTimeInputToSeconds("45")).toBe(45);
    expect(parseTimeInputToSeconds("")).toBe(0);
  });

  it("должен форматировать метку дистанции", () => {
    expect(getDistanceLabel(10000)).toBe("10 000 м");
  });

  it("должен безопасно парсить сохраненные результаты пейлоад", () => {
    expect(safeParseSaved(null)).toEqual([]);
    expect(safeParseSaved("not-json")).toEqual([]);
    expect(
      safeParseSaved(
        JSON.stringify([
          {
            id: "1",
            distanceMeters: 1000,
            resultSeconds: 220,
            paceSeconds: 220,
            lapSeconds: 88,
            createdAt: "2026-02-09T00:00:00.000Z",
          },
          { id: "bad" },
        ])
      )
    ).toHaveLength(1);
  });
});
