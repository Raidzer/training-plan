import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { AdminInvitesFilters } from "@/app/(protected)/admin/invites/AdminInvitesClient/components/AdminInvitesFilters/AdminInvitesFilters";
import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";

function renderFilters(overrides: Partial<ComponentProps<typeof AdminInvitesFilters>> = {}) {
  const props: ComponentProps<typeof AdminInvitesFilters> = {
    query: "",
    roleFilter: "all",
    statusFilter: "all",
    resultsCount: 12,
    hasActiveFilters: false,
    isSearchPending: false,
    onQueryChange: vi.fn(),
    onRoleFilterChange: vi.fn(),
    onStatusFilterChange: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<AdminInvitesFilters {...props} />),
    props,
  };
}

describe("AdminInvitesFilters", () => {
  it("передаёт поисковый запрос и озвучивает количество результатов", () => {
    const { props } = renderFilters({ resultsCount: 21, isSearchPending: true });

    fireEvent.change(screen.getByRole("textbox", { name: ADMIN_INVITES_LABELS.searchLabel }), {
      target: { value: "Анна" },
    });

    expect(props.onQueryChange).toHaveBeenCalledWith("Анна");
    const results = screen.getByText("21 приглашение");
    expect(results.getAttribute("aria-live")).toBe("polite");
    expect(results.getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("блокирует неактуальный сброс и вызывает его для активных фильтров", () => {
    const { props, rerender } = renderFilters();
    const resetButton = screen.getByRole("button", {
      name: ADMIN_INVITES_LABELS.resetFiltersButton,
    });

    expect(resetButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(resetButton);
    expect(props.onReset).not.toHaveBeenCalled();

    rerender(<AdminInvitesFilters {...props} hasActiveFilters />);
    fireEvent.click(screen.getByRole("button", { name: ADMIN_INVITES_LABELS.resetFiltersButton }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });
});
