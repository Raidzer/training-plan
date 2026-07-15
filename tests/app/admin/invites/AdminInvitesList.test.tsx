import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { AdminInvitesList } from "@/app/(protected)/admin/invites/AdminInvitesClient/components/AdminInvitesList/AdminInvitesList";
import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";
import type { AdminInviteRow } from "@/app/(protected)/admin/invites/AdminInvitesClient/types/adminInvitesTypes";

function createInvite(overrides: Partial<AdminInviteRow> = {}): AdminInviteRow {
  return {
    id: 1,
    role: "athlete",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-02T00:00:00.000Z",
    usedAt: null,
    status: "active",
    createdBy: {
      id: 10,
      name: "Админ",
      email: "admin@example.com",
    },
    usedBy: null,
    ...overrides,
  };
}

function renderInvitesList(
  invites: AdminInviteRow[],
  overrides: Partial<ComponentProps<typeof AdminInvitesList>> = {}
) {
  const props: ComponentProps<typeof AdminInvitesList> = {
    invites,
    tokenById: {},
    totalResults: invites.length,
    currentPage: 1,
    hasActiveFilters: false,
    onCopy: vi.fn(),
    onPageChange: vi.fn(),
    onResetFilters: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<AdminInvitesList {...props} />),
    props,
  };
}

describe("AdminInvitesList", () => {
  it("показывает роли и статусы карточек и копирует только доступную активную ссылку", () => {
    const activeInvite = createInvite();
    const usedInvite = createInvite({
      id: 2,
      role: "coach",
      status: "used",
      usedAt: "2026-01-01T12:00:00.000Z",
      usedBy: {
        id: 20,
        name: "",
        email: "used@example.com",
      },
    });
    const expiredInvite = createInvite({
      id: 3,
      role: "custom",
      status: "expired",
      createdBy: null,
    });
    const { props } = renderInvitesList([activeInvite, usedInvite, expiredInvite], {
      tokenById: {
        1: "token-active",
        2: "token-used",
      },
    });

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(within(cards[0]).getByText("Активно")).toBeTruthy();
    expect(within(cards[0]).getByText("Атлет")).toBeTruthy();
    expect(within(cards[0]).getByText("Админ")).toBeTruthy();
    expect(within(cards[1]).getAllByText("Использовано").length).toBeGreaterThan(0);
    expect(within(cards[1]).getByText("Тренер")).toBeTruthy();
    expect(within(cards[1]).getByText("used@example.com")).toBeTruthy();
    expect(within(cards[2]).getAllByText("Истекло").length).toBeGreaterThan(0);
    expect(within(cards[2]).getByText("custom")).toBeTruthy();

    const copyButton = screen.getByRole("button", {
      name: `${ADMIN_INVITES_LABELS.copyButton} #0001`,
    });
    fireEvent.click(copyButton);

    expect(props.onCopy).toHaveBeenCalledTimes(1);
    expect(props.onCopy).toHaveBeenCalledWith(expect.stringContaining("token-active"));
    expect(within(cards[1]).queryByRole("button", { name: /Скопировать/ })).toBeNull();
    expect(within(cards[2]).queryByRole("button", { name: /Скопировать/ })).toBeNull();
  });

  it("объясняет, почему активная ссылка без runtime-токена скрыта", () => {
    renderInvitesList([createInvite()]);

    expect(screen.getByText(ADMIN_INVITES_LABELS.hiddenLinkTitle)).toBeTruthy();
    expect(screen.getByText(ADMIN_INVITES_LABELS.hiddenLinkNote)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Скопировать/ })).toBeNull();
  });

  it("показывает отдельное пустое состояние активных фильтров и сбрасывает их", () => {
    const onResetFilters = vi.fn();
    renderInvitesList([], {
      hasActiveFilters: true,
      onResetFilters,
    });

    expect(
      screen.getByRole("heading", { name: ADMIN_INVITES_LABELS.emptySearchTitle })
    ).toBeTruthy();
    expect(screen.getByText(ADMIN_INVITES_LABELS.emptySearchText)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: ADMIN_INVITES_LABELS.resetFiltersButton }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it("предлагает перейти к форме, когда приглашений ещё нет", () => {
    renderInvitesList([]);

    expect(
      screen.getByRole("heading", { name: ADMIN_INVITES_LABELS.emptyInvitesTitle })
    ).toBeTruthy();
    expect(screen.getByText(ADMIN_INVITES_LABELS.emptyInvitesText)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: ADMIN_INVITES_LABELS.createButton }).getAttribute("href")
    ).toBe("#admin-invite-create");
  });

  it("показывает пагинацию только когда результатов больше размера страницы", () => {
    const invites = Array.from({ length: 10 }, (_, index) => createInvite({ id: index + 1 }));
    const { rerender } = renderInvitesList(invites, { totalResults: 10 });

    expect(screen.queryByRole("navigation", { name: "Страницы списка приглашений" })).toBeNull();

    rerender(
      <AdminInvitesList
        invites={invites}
        tokenById={{}}
        totalResults={11}
        currentPage={1}
        hasActiveFilters={false}
        onCopy={vi.fn()}
        onPageChange={vi.fn()}
        onResetFilters={vi.fn()}
      />
    );

    expect(screen.getByRole("navigation", { name: "Страницы списка приглашений" })).toBeTruthy();
  });
});
