import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/app/(protected)/dashboard/DashboardClient/DashboardClient";
import { DASHBOARD_CARDS } from "@/app/(protected)/dashboard/DashboardClient/constants/dashboardConstants";

vi.mock("next/link", () => {
  return {
    default: ({
      children,
      className,
      href,
    }: {
      children: ReactNode;
      className?: string;
      href: string;
    }) => (
      <a className={className} href={href}>
        {children}
      </a>
    ),
  };
});

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

const createSession = (role: "admin" | "user", email = "test@example.com"): Session =>
  ({
    expires: "2099-01-01T00:00:00.000Z",
    user: {
      email,
      name: "Test User",
      role,
    },
  }) as Session;

describe("DashboardClient", () => {
  it("показывает admin-only карточки администратору", () => {
    render(<DashboardClient session={createSession("admin")} />);

    for (const card of DASHBOARD_CARDS) {
      const link = screen.getByRole("link", { name: new RegExp(card.title) });

      expect(link.getAttribute("href")).toBe(card.href);
    }
  });

  it("скрывает admin-only карточки для обычного пользователя", () => {
    render(<DashboardClient session={createSession("user")} />);

    expect(screen.queryByText("Администрирование")).toBeNull();
    expect(screen.queryByText("Шаблоны")).toBeNull();

    for (const card of DASHBOARD_CARDS.filter((item) => !item.adminOnly)) {
      const link = screen.getByRole("link", { name: new RegExp(card.title) });

      expect(link.getAttribute("href")).toBe(card.href);
    }
  });
});
