import { describe, expect, it } from "vitest";
import { parseSleepCommand } from "@/alice/parser";

describe("alice/parser", () => {
  it("parseSleepCommand должен парсить команду сна с числом", () => {
    expect(parseSleepCommand("запиши сон 7.5")).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("сон 7,5")).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("запиши количество сна 7 часов")).toEqual({ sleepHours: 7 });
    expect(parseSleepCommand("запиши сном 7 часов")).toEqual({ sleepHours: 7 });
    expect(parseSleepCommand("спал 8 часов")).toEqual({ sleepHours: 8 });
    expect(parseSleepCommand("спала 7 часов 30 минут")).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("запиши сон 8 и 32")).toEqual({ sleepHours: 8.53 });
    expect(parseSleepCommand("запиши сон 845")).toEqual({ sleepHours: 8.75 });
    expect(parseSleepCommand("сон 1032")).toEqual({ sleepHours: 10.53 });
  });

  it("parseSleepCommand должен парсить числовую реплику при ожидаемом вводе сна", () => {
    expect(parseSleepCommand("7 и 30", { allowNumericOnly: true })).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("7 и 5", { allowNumericOnly: true })).toEqual({ sleepHours: 7.5 });
    expect(parseSleepCommand("7 часов 38 минут", { allowNumericOnly: true })).toEqual({
      sleepHours: 7.63,
    });
    expect(parseSleepCommand("8 и 32", { allowNumericOnly: true })).toEqual({ sleepHours: 8.53 });
    expect(parseSleepCommand("8 часов", { allowNumericOnly: true })).toEqual({ sleepHours: 8 });
    expect(parseSleepCommand("845", { allowNumericOnly: true })).toEqual({ sleepHours: 8.75 });
    expect(parseSleepCommand("1032", { allowNumericOnly: true })).toEqual({ sleepHours: 10.53 });
  });

  it("parseSleepCommand должен отклонять ввод без маркера сна вне ожидаемого режима", () => {
    expect(parseSleepCommand("7 и 30")).toBeNull();
    expect(parseSleepCommand("845")).toBeNull();
    expect(parseSleepCommand("запиши сон")).toBeNull();
    expect(parseSleepCommand("сон 25")).toBeNull();
    expect(parseSleepCommand("сон 1260")).toBeNull();
    expect(parseSleepCommand("весна 7")).toBeNull();
  });
});
