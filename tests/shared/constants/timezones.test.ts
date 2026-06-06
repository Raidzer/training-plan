import { describe, expect, it } from "vitest";
import { buildTimezoneOptions, filterTimezoneOption } from "@/shared/constants/timezones";

describe("timezone options", () => {
  it("должен показывать российские города в начале списка", () => {
    const options = buildTimezoneOptions(new Date("2026-01-01T00:00:00.000Z"));

    expect(options).toHaveLength(11);
    expect(options[0]).toMatchObject({
      value: "Europe/Kaliningrad",
    });
    expect(options.find((option) => option.value === "Europe/Moscow")?.label).toContain("Москва");
  });

  it("должен искать часовой пояс по русскому названию города", () => {
    const options = buildTimezoneOptions(new Date("2026-01-01T00:00:00.000Z"));
    const moscow = options.find((option) => option.value === "Europe/Moscow");
    const yekaterinburg = options.find((option) => option.value === "Asia/Yekaterinburg");
    const krasnoyarsk = options.find((option) => option.value === "Asia/Krasnoyarsk");

    expect(filterTimezoneOption("москва", moscow)).toBe(true);
    expect(filterTimezoneOption("екатеринбург", yekaterinburg)).toBe(true);
    expect(filterTimezoneOption("красноярск", krasnoyarsk)).toBe(true);
  });

  it("должен добавлять сохраненный часовой пояс сверх короткого списка", () => {
    const options = buildTimezoneOptions(new Date("2026-01-01T00:00:00.000Z"), [
      "Asia/Novosibirsk",
    ]);

    expect(options).toHaveLength(12);
    expect(options.find((option) => option.value === "Asia/Novosibirsk")?.label).toContain(
      "Asia/Novosibirsk"
    );
  });

  it("не должен дублировать значения часовых поясов", () => {
    const options = buildTimezoneOptions(new Date("2026-01-01T00:00:00.000Z"));
    const values = options.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });
});
