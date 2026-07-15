import { describe, expect, it } from "vitest";
import { metadata } from "@/app/results/page";

describe("ResultsPage metadata", () => {
  it("describes the public club results route", () => {
    expect(metadata.title).toBe("Результаты клуба | СПИРОС");
    expect(metadata.description).toContain("результаты участников СПИРОС");
  });
});
