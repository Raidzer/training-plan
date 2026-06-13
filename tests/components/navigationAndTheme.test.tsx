import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/Header/Header";
import { ThemeProvider, useThemeMode, type Mode } from "@/components/ThemeProvider/ThemeProvider";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/diary",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}));

function ThemeConsumer() {
  const { mode, setMode } = useThemeMode();

  return (
    <button type="button" onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
      theme-{mode}
    </button>
  );
}

describe("Header", () => {
  it("переключает тему и открывает мобильное меню", async () => {
    const onToggle = vi.fn();

    render(<Header mode="light" onToggle={onToggle} />);

    fireEvent.click(screen.getAllByRole("switch")[0]);
    expect(onToggle).toHaveBeenCalledWith("dark");

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню навигации" }));
    expect(await screen.findByText("Меню")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("switch")[1]);
    expect(onToggle).toHaveBeenCalledWith("dark");

    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.getByText("Меню")).toBeTruthy();
  });

  it("переключает темную тему обратно в светлую", () => {
    const onToggle = vi.fn();

    render(<Header mode="dark" onToggle={onToggle} />);
    fireEvent.click(screen.getAllByRole("switch")[0]);

    expect(onToggle).toHaveBeenCalledWith("light");
  });
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/diary";
    localStorage.clear();
    document.cookie = "ui-theme=; path=/; max-age=0";
    document.documentElement.classList.remove("dark");
  });

  it("сохраняет темную тему через контекст и обновляет html class", () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "theme-light" }));

    expect(screen.getByRole("button", { name: "theme-dark" })).toBeTruthy();
    expect(localStorage.getItem("ui-theme")).toBe("dark");
    expect(document.cookie).toContain("ui-theme=dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("снимает dark class при переходе в светлую тему на full-width route", () => {
    navigationMocks.pathname = "/tools/templates/editor";
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider initialTheme={"dark" as Mode}>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "theme-dark" }));

    expect(screen.getByRole("button", { name: "theme-light" })).toBeTruthy();
    expect(localStorage.getItem("ui-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("не показывает общий header на Telegram routes", () => {
    navigationMocks.pathname = "/telegram/tools";

    render(
      <ThemeProvider initialTheme="light">
        <div>Telegram content</div>
      </ThemeProvider>
    );

    expect(screen.getByText("Telegram content")).toBeTruthy();
    expect(screen.queryByText("Беговой клуб СПИРОС")).toBeNull();
  });
});
