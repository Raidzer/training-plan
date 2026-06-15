import { describe, expect, it } from "vitest";
import {
  formatCompetitionDate,
  parseCompetitionDistanceMeters,
} from "@/shared/utils/competitionUtils";

describe("competitionUtils", () => {
  it("должен парсить привычные записи дистанций в метры", () => {
    expect(parseCompetitionDistanceMeters("21.1 км")).toBe(21100);
    expect(parseCompetitionDistanceMeters("10,5 km")).toBe(10500);
    expect(parseCompetitionDistanceMeters("3000 м")).toBe(3000);
    expect(parseCompetitionDistanceMeters("1500m")).toBe(1500);
  });

  it("должен возвращать null для невалидных дистанций", () => {
    expect(parseCompetitionDistanceMeters("")).toBeNull();
    expect(parseCompetitionDistanceMeters("полумарафон")).toBeNull();
    expect(parseCompetitionDistanceMeters("-10 км")).toBeNull();
  });

  it("должен форматировать ISO-дату для таблицы", () => {
    expect(formatCompetitionDate("2026-05-24")).toBe("24.05.2026");
    expect(formatCompetitionDate("bad-date")).toBe("bad-date");
  });
});
