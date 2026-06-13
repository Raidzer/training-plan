import { describe, expect, it } from "vitest";
import {
  calculateCameronEquivalentSeconds,
  calculateDanielsEquivalentSeconds,
  calculateDanielsVdot,
  calculateEquivalentSeconds,
  calculateRiegelEquivalentSeconds,
  formatDistanceLabel,
  formatPace,
  formatTime,
  normalizeDistanceInputValue,
  parseTimeInputToSeconds,
  toNonNegativeInt,
} from "@/app/tools/result-equivalent/ResultEquivalentClient/utils/resultEquivalentUtils";

describe("app/tools/result-equivalent.utils", () => {
  it("должен парсить и нормализовать дистанцию", () => {
    expect(toNonNegativeInt("5000")).toBe(5000);
    expect(toNonNegativeInt("-100")).toBe(0);
    expect(toNonNegativeInt("bad")).toBe(0);
    expect(normalizeDistanceInputValue("05000")).toBe("5000");
    expect(normalizeDistanceInputValue("")).toBe("");
  });

  it("должен парсить строку времени в секунды", () => {
    expect(parseTimeInputToSeconds("00:20:00")).toBe(1200);
    expect(parseTimeInputToSeconds("20:00")).toBe(1200);
    expect(parseTimeInputToSeconds("45")).toBe(45);
    expect(parseTimeInputToSeconds("bad")).toBe(0);
  });

  it("должен считать эквивалент результата по формуле Ригеля", () => {
    expect(calculateRiegelEquivalentSeconds(1200, 5000, 10000)).toBe(2502);
    expect(calculateRiegelEquivalentSeconds(1200, 5000, 21097)).toBe(5520);
    expect(calculateEquivalentSeconds("riegel", 1200, 5000, 10000)).toBe(2502);
    expect(calculateEquivalentSeconds("riegel", 0, 5000, 10000)).toBe(0);
  });

  it("должен считать эквивалент результата по модели Cameron", () => {
    expect(calculateCameronEquivalentSeconds(1200, 5000, 10000)).toBe(2500);
    expect(calculateCameronEquivalentSeconds(1200, 5000, 42195)).toBe(11711);
    expect(calculateEquivalentSeconds("cameron", 1200, 5000, 10000)).toBe(2500);
  });

  it("должен считать эквивалент результата по модели Daniels/VDOT", () => {
    expect(calculateDanielsVdot(5000, 1200)).toBeCloseTo(49.81, 2);
    expect(calculateDanielsEquivalentSeconds(1200, 5000, 10000)).toBe(2488);
    expect(calculateDanielsEquivalentSeconds(1200, 5000, 42195)).toBe(11477);
    expect(calculateEquivalentSeconds("daniels", 1200, 5000, 10000)).toBe(2488);
  });

  it("должен форматировать время, темп и дистанцию", () => {
    expect(formatTime(2502)).toBe("00:41:42");
    expect(formatPace(2502, 10000)).toBe("04:10 /км");
    expect(formatDistanceLabel(21097)).toBe("21 097 м");
  });
});
