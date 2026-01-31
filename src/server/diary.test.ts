import { describe, it, expect } from "vitest";
import {
  isValidDateString,
  parseDistanceKm,
  formatSleep,
  formatWeightValue,
} from "@/shared/utils/diaryUtils";

describe("isValidDateString", () => {
  it("должен возвращать true для валидной даты в формате YYYY-MM-DD", () => {
    expect(isValidDateString("2023-10-05")).toBe(true);
  });

  it("должен возвращать false для невалидного формата", () => {
    expect(isValidDateString("05-10-2023")).toBe(false);
    expect(isValidDateString("invalid")).toBe(false);
    expect(isValidDateString("")).toBe(false);
    expect(isValidDateString(null)).toBe(false);
  });
});

describe("parseDistanceKm", () => {
  it("должен корректно парсить числа", () => {
    expect(parseDistanceKm(10)).toBe(10);
    expect(parseDistanceKm(10.5)).toBe(10.5);
  });

  it("должен парсить строки", () => {
    expect(parseDistanceKm("10")).toBe(10);
    expect(parseDistanceKm("10.5")).toBe(10.5);
  });

  it("должен возвращать 0 для null/undefined/пустой строки", () => {
    expect(parseDistanceKm(null)).toBe(0);
    expect(parseDistanceKm(undefined)).toBe(0);
    expect(parseDistanceKm("")).toBe(0);
  });
});

describe("formatSleep", () => {
  it("должен форматировать часы сна", () => {
    expect(formatSleep({ sleepHours: "8" })).toBe("08:00");
    expect(formatSleep({ sleepHours: "7.5" })).toBe("07:30");
  });

  it("должен возвращать прочерк при отсутствии данных", () => {
    expect(formatSleep({ sleepHours: null })).toBe("-");
    expect(formatSleep(undefined)).toBe("-");
  });
});

describe("formatWeightValue", () => {
  it("должен округлять до 1 знака", () => {
    expect(formatWeightValue("70.123")).toBe("70.1");
    expect(formatWeightValue("70")).toBe("70.0");
  });
});
