import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAdminInvitesDirectory } from "@/app/(protected)/admin/invites/AdminInvitesClient/hooks/useAdminInvitesDirectory";
import type { AdminInviteRow } from "@/app/(protected)/admin/invites/AdminInvitesClient/types/adminInvitesTypes";

function createInvite(id: number, overrides: Partial<AdminInviteRow> = {}): AdminInviteRow {
  return {
    id,
    role: "athlete",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-02T00:00:00.000Z",
    usedAt: null,
    status: "active",
    createdBy: null,
    usedBy: null,
    ...overrides,
  };
}

describe("useAdminInvitesDirectory", () => {
  it("управляет пагинацией, поиском и сбрасывает страницу при изменении запроса", async () => {
    const invites = Array.from({ length: 12 }, (_, index) => createInvite(index + 1));
    const { result } = renderHook(() => useAdminInvitesDirectory(invites));

    expect(result.current.stats).toEqual({ total: 12, active: 12, used: 0, expired: 0 });
    expect(result.current.visibleInvites).toHaveLength(10);
    expect(result.current.filteredInvitesCount).toBe(12);

    act(() => {
      result.current.updatePage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.visibleInvites.map((invite) => invite.id)).toEqual([11, 12]);

    act(() => {
      result.current.updateQuery("#0012");
    });

    await waitFor(() => {
      expect(result.current.isSearchPending).toBe(false);
      expect(result.current.filteredInvitesCount).toBe(1);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.visibleInvites[0]?.id).toBe(12);
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.resetFilters();
    });

    await waitFor(() => {
      expect(result.current.filteredInvitesCount).toBe(12);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("совмещает фильтры роли и статуса и сохраняет общую сводку", () => {
    const invites = [
      createInvite(1, { role: "coach", status: "active" }),
      createInvite(2, { role: "coach", status: "expired" }),
      createInvite(3, { role: "athlete", status: "expired" }),
      createInvite(4, { role: "athlete", status: "used" }),
    ];
    const { result } = renderHook(() => useAdminInvitesDirectory(invites));

    act(() => {
      result.current.updateRoleFilter("coach");
      result.current.updateStatusFilter("expired");
    });

    expect(result.current.filteredInvitesCount).toBe(1);
    expect(result.current.visibleInvites[0]?.id).toBe(2);
    expect(result.current.stats).toEqual({ total: 4, active: 1, used: 1, expired: 2 });
  });

  it("ограничивает текущую страницу после сокращения входного списка", () => {
    const initialInvites = Array.from({ length: 12 }, (_, index) => createInvite(index + 1));
    const { result, rerender } = renderHook(({ invites }) => useAdminInvitesDirectory(invites), {
      initialProps: { invites: initialInvites },
    });

    act(() => {
      result.current.updatePage(2);
    });
    expect(result.current.currentPage).toBe(2);

    rerender({ invites: [createInvite(1)] });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.visibleInvites.map((invite) => invite.id)).toEqual([1]);
  });
});
