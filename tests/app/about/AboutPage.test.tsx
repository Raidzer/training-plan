import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage, { metadata } from "@/app/about/page";

describe("AboutPage", () => {
  it("задаёт метаинформацию страницы", () => {
    expect(metadata.title).toBe("О клубе | СПИРОС");
    expect(metadata.description).toContain("находится в разработке");
  });

  it("показывает заглушку без неподтверждённого содержимого", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1, name: "О клубе" })).toBeTruthy();
    expect(
      screen.getByText("Страница в разработке. Скоро здесь появится описание клуба.")
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
