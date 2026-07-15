import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicToolsNavigation } from "@/components/PublicToolsNavigation/PublicToolsNavigation";

describe("PublicToolsNavigation", () => {
  it("показывает три инструмента и отмечает текущий маршрут", () => {
    render(<PublicToolsNavigation activeHref="/tools/speed-to-pace" />);

    const navigation = screen.getByRole("navigation", {
      name: "Переключение беговых инструментов",
    });
    const links = navigation.querySelectorAll("a");

    expect(links).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Скорость и темп/ }).getAttribute("aria-current")).toBe(
      "page"
    );
    expect(screen.getByRole("link", { name: /Темп и раскладка/ }).getAttribute("href")).toBe(
      "/tools/pace-calculator"
    );
  });
});
