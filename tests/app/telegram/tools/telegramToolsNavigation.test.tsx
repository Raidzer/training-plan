import { fireEvent, render, screen } from "@testing-library/react";
import type { AriaAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramToolsNavigation } from "@/app/telegram/tools/TelegramToolsClient/components/TelegramToolsNavigation/TelegramToolsNavigation";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/telegram/tools/result-equivalent",
}));

const themeMocks = vi.hoisted(() => ({
  mode: "light" as "light" | "dark",
  setModeMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-current": ariaCurrent,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-current"?: AriaAttributes["aria-current"];
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}));

vi.mock("@/components/ThemeProvider/ThemeProvider", () => ({
  useThemeMode: () => ({
    mode: themeMocks.mode,
    setMode: themeMocks.setModeMock,
  }),
}));

describe("TelegramToolsNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.pathname = "/telegram/tools/result-equivalent";
    themeMocks.mode = "light";
  });

  it("показывает ссылку на список и все калькуляторы", () => {
    render(<TelegramToolsNavigation />);

    expect(screen.getByRole("link", { name: "Все" }).getAttribute("href")).toBe("/telegram/tools");
    expect(screen.getByRole("link", { name: "Эквивалент" }).getAttribute("href")).toBe(
      "/telegram/tools/result-equivalent"
    );
    expect(screen.getByRole("link", { name: "Темп" }).getAttribute("href")).toBe(
      "/telegram/tools/pace-calculator"
    );
    expect(screen.getByRole("link", { name: "Скорость" }).getAttribute("href")).toBe(
      "/telegram/tools/speed-to-pace"
    );
  });

  it("отмечает текущий калькулятор", () => {
    render(<TelegramToolsNavigation />);

    expect(screen.getByRole("link", { name: "Эквивалент" }).getAttribute("aria-current")).toBe(
      "page"
    );
  });

  it("переключает тему из Telegram navigation", () => {
    render(<TelegramToolsNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "Включить темную тему" }));

    expect(themeMocks.setModeMock).toHaveBeenCalledWith("dark");
  });

  it("показывает действие перехода на светлую тему в dark mode", () => {
    themeMocks.mode = "dark";

    render(<TelegramToolsNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "Включить светлую тему" }));

    expect(themeMocks.setModeMock).toHaveBeenCalledWith("light");
  });
});
