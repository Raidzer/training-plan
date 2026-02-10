import { describe, expect, it } from "vitest";
import {
  KM_PER_MILE,
  parseTimeInputToTotalMinutes,
  roundTo,
  splitMinutesSeconds,
  toNonNegativeFloat,
  toNonNegativeInt,
  toTotalMinutes,
} from "@/app/tools/speed-to-pace/speed-to-pace.utils";

describe("app/tools/speed-to-pace.utils", () => {
  it("должен парсить неотрицательные числа", () => {
    expect(toNonNegativeFloat("12,5")).toBe(12.5);
    expect(toNonNegativeFloat("-5")).toBe(0);
    expect(toNonNegativeFloat("bad")).toBe(0);
    expect(toNonNegativeInt("15")).toBe(15);
    expect(toNonNegativeInt("-3")).toBe(0);
  });

  it("должен округлять и конвертировать минутные хелперы", () => {
    expect(roundTo(1.234, 2)).toBe(1.23);
    expect(roundTo(Number.NaN, 2)).toBe(0);
    expect(splitMinutesSeconds(3.5)).toEqual({ minutes: 3, seconds: 30 });
    expect(splitMinutesSeconds(0)).toEqual({ minutes: 0, seconds: 0 });
    expect(toTotalMinutes(3, 30)).toBe(3.5);
    expect(toTotalMinutes(Number.NaN, 30)).toBe(0);
  });

  it("должен парсить строки ввода времени в общее число минут", () => {
    expect(parseTimeInputToTotalMinutes("01:02:30")).toBe(62.5);
    expect(parseTimeInputToTotalMinutes("03:30")).toBe(3.5);
    expect(parseTimeInputToTotalMinutes("5")).toBe(5);
  });

  it("должен предоставлять константу пересчета миль", () => {
    expect(KM_PER_MILE).toBeCloseTo(1.609344, 6);
  });
});
