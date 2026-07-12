import { fireEvent, render, screen } from "@testing-library/react";
import type { AriaAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/Header/Header";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/diary",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-current": ariaCurrent,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-current"?: AriaAttributes["aria-current"];
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}));

describe("Header", () => {
  it("открывает мобильное меню без переключателя темы", async () => {
    render(<Header />);

    expect(screen.queryByRole("switch")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Открыть меню навигации" }));
    expect(await screen.findByText("Навигация")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText("Тема")).toBeNull();
  });

  it("показывает основные ссылки навигации", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "О клубе" }).getAttribute("href")).toBe("/about");
    expect(screen.getByRole("link", { name: "Результаты клуба" }).getAttribute("href")).toBe(
      "/results"
    );
    expect(screen.getByRole("link", { name: "Личный кабинет" }).getAttribute("href")).toBe(
      "/dashboard"
    );
  });

  it("отмечает текущий раздел навигации", () => {
    navigationMocks.pathname = "/about";

    render(<Header />);

    expect(screen.getByRole("link", { name: "О клубе" }).getAttribute("aria-current")).toBe("page");
  });
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/diary";
  });

  it("показывает контент в фиксированной теме без переключателя", () => {
    render(
      <ThemeProvider>
        <div>Diary content</div>
      </ThemeProvider>
    );

    expect(screen.getByText("Diary content")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Беговой клуб СПИРОС" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Перейти к содержимому" }).getAttribute("href")).toBe(
      "#main-content"
    );
    expect(document.getElementById("main-content")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("не показывает общий header на Telegram routes", () => {
    navigationMocks.pathname = "/telegram/tools";

    render(
      <ThemeProvider>
        <div>Telegram content</div>
      </ThemeProvider>
    );

    expect(screen.getByText("Telegram content")).toBeTruthy();
    expect(screen.queryByText("Беговой клуб СПИРОС")).toBeNull();
  });
});
