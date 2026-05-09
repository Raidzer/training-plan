import { describe, expect, it } from "vitest";
import { parseSleepCommand } from "@/alice/parser";

describe("alice/parser", () => {
  it("parseSleepCommand должен парсить команду сна с числом", () => {
    expect(parseSleepCommand("запиши сон 7.5")).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("сон 7,5")).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("спал 8 часов")).toEqual({ sleepHours: 8 });
    expect(parseSleepCommand("спала 7 часов 30 минут")).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("запиши сон 8 и 32")).toEqual({ sleepHours: 8.53 });
  });

  it("parseSleepCommand должен парсить числовую реплику при ожидаемом вводе сна", () => {
    expect(parseSleepCommand("7 и 30", { allowNumericOnly: true })).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("7 и 5", { allowNumericOnly: true })).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("8 и 32", { allowNumericOnly: true })).toEqual({ sleepHours: 8.53 });
    expect(parseSleepCommand("8 часов", { allowNumericOnly: true })).toEqual({ sleepHours: 8 });
  });

  it("parseSleepCommand должен отклонять ввод без маркера сна вне ожидаемого режима", () => {
    expect(parseSleepCommand("7 и 30")).toBeNull();
    expect(parseSleepCommand("запиши сон")).toBeNull();
    expect(parseSleepCommand("сон 25")).toBeNull();
  });
});
