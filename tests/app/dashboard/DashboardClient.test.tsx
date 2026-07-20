import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/app/(protected)/dashboard/DashboardClient/DashboardClient";

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

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
  signOut: signOutMock,
}));

type DashboardRole = "admin" | "athlete" | "coach";

type DashboardLinkContract = {
  title: string;
  href: string;
};

const ADMIN_LINKS: DashboardLinkContract[] = [
  { title: "Пользователи", href: "/admin/users" },
  { title: "Приглашения", href: "/admin/invites" },
  { title: "Шаблоны", href: "/tools/templates" },
];

const PUBLIC_LINKS: DashboardLinkContract[] = [
  { title: "План", href: "/plan" },
  { title: "Ежедневный отчёт", href: "/diary" },
  { title: "Дневник", href: "/diary/period" },
  { title: "Обувь", href: "/profile/shoes" },
  { title: "Рекорды", href: "/profile/records" },
  { title: "Соревнования", href: "/profile/competitions" },
];

const REMOVED_SECTION_DESCRIPTIONS = [
  "Пользователи, приглашения и шаблоны для работы клуба.",
  "Планируйте тренировки и фиксируйте выполненную работу.",
  "Экипировка, личные рекорды и календарь соревнований.",
] as const;

const createSession = (
  role: DashboardRole,
  name: string | null = "Test User",
  email = "test@example.com"
): Session =>
  ({
    expires: "2099-01-01T00:00:00.000Z",
    user: {
      email,
      name,
      role,
    },
  }) as Session;

function expectDashboardLink({ title, href }: DashboardLinkContract) {
  const heading = screen.getByRole("heading", { level: 3, name: title });
  const link = heading.closest("a");

  expect(link).not.toBeNull();
  expect(link?.getAttribute("href")).toBe(href);
}

describe("DashboardClient", () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it("показывает администратору полный контракт ссылок", () => {
    render(<DashboardClient session={createSession("admin")} />);

    for (const link of [...ADMIN_LINKS, ...PUBLIC_LINKS]) {
      expectDashboardLink(link);
    }

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9);
  });

  it.each(["athlete", "coach"] as const)("скрывает admin-only ссылки для роли %s", (role) => {
    render(<DashboardClient session={createSession(role)} />);

    for (const link of ADMIN_LINKS) {
      expect(screen.queryByRole("heading", { level: 3, name: link.title })).toBeNull();
    }

    for (const link of PUBLIC_LINKS) {
      expectDashboardLink(link);
    }

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
  });

  it("показывает корректный заголовок и семантическую ссылку профиля", () => {
    render(<DashboardClient session={createSession("athlete")} />);

    expect(screen.getByRole("heading", { level: 1, name: "Личный кабинет" })).toBeTruthy();

    const profileLink = screen.getByRole("link", { name: "Профиль" });

    expect(profileLink.getAttribute("href")).toBe("/profile");
    expect(profileLink.querySelector("button")).toBeNull();
  });

  it("не показывает описания секций", () => {
    render(<DashboardClient session={createSession("admin")} />);

    for (const description of REMOVED_SECTION_DESCRIPTIONS) {
      expect(screen.queryByText(description)).toBeNull();
    }
  });

  it("показывает актуальное описание карточки плана", () => {
    render(<DashboardClient session={createSession("athlete")} />);

    expect(screen.getByText("Загружайте тренировочный план.")).toBeTruthy();
    expect(screen.queryByText("Планируйте цели и запланированные тренировки.")).toBeNull();
  });

  it("выходит из аккаунта с возвратом на страницу входа", async () => {
    render(<DashboardClient session={createSession("athlete")} />);

    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/login" });
    });
  });
});
