import { describe, expect, it } from "vitest";
import { z } from "zod";
import { maxStringLength, minStringLength } from "@/shared/utils/stringValidation";

describe("stringValidation", () => {
  it.each([
    ["abcde", false],
    ["abcdef", true],
    ["a😀b😀", true],
    ["😀😀", false],
    ["e\u0301abc", false],
    ["e\u0301abcd", true],
  ])("сохраняет минимальную длину UTF-16 для %s", (value, accepted) => {
    const schema = z.string().check(minStringLength(6));

    expect(schema.safeParse(value).success).toBe(accepted);
  });

  it.each([
    ["abcdef", true],
    ["abcdefg", false],
    ["😀😀😀", true],
    ["😀😀😀😀", false],
  ])("сохраняет максимальную длину UTF-16 для %s", (value, accepted) => {
    const schema = z.string().check(maxStringLength(6));

    expect(schema.safeParse(value).success).toBe(accepted);
  });

  it("проверяет длину после trim и сохраняет нормализованное значение", () => {
    const schema = z.string().trim().check(minStringLength(6), maxStringLength(6));

    expect(schema.parse("  a😀b😀  ")).toBe("a😀b😀");
    expect(schema.safeParse("      ").success).toBe(false);
  });

  it("сохраняет optional, nullable и проверку типа", () => {
    const schema = z.string().check(maxStringLength(6)).nullable().optional();

    expect(schema.parse(null)).toBeNull();
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.safeParse(123).success).toBe(false);
  });

  it("сохраняет сообщение и путь ошибки поля", () => {
    const schema = z.object({
      password: z.string().check(minStringLength(6, "Минимум 6 символов")),
    });
    const result = schema.safeParse({ password: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        message: "Минимум 6 символов",
        path: ["password"],
      });
    }
  });
});
