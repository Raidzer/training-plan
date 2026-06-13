import { render, screen } from "@testing-library/react";
import type { AriaAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TelegramToolsNavigation } from "@/app/telegram/tools/TelegramToolsClient/components/TelegramToolsNavigation/TelegramToolsNavigation";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/telegram/tools/result-equivalent",
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

describe("TelegramToolsNavigation", () => {
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
});
