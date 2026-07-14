import { describe, expect, it } from "vitest";
import { metadata } from "@/app/(protected)/profile/competitions/page";

describe("CompetitionsPage metadata", () => {
  it("должен задавать заголовок страницы соревнований", () => {
    expect(metadata.title).toBe("Соревнования | СПИРОС");
  });
});
