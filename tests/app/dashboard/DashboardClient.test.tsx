import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/app/dashboard/DashboardClient/DashboardClient";

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
    const { container } = render(<DashboardClient session={createSession("admin")} />);

    expect(container.querySelectorAll("a .ant-card")).toHaveLength(7);
    expect(screen.getByText("Администрирование")).toBeTruthy();
    expect(screen.getByText("Шаблоны")).toBeTruthy();
  });

  it("скрывает admin-only карточки для обычного пользователя", () => {
    const { container } = render(<DashboardClient session={createSession("user")} />);

    expect(container.querySelectorAll("a .ant-card")).toHaveLength(5);
    expect(screen.queryByText("Администрирование")).toBeNull();
    expect(screen.queryByText("Шаблоны")).toBeNull();
    expect(screen.getByText("План")).toBeTruthy();
    expect(screen.getByText("Дневник")).toBeTruthy();
  });
});
