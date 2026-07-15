import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAdminUsersDirectory } from "@/app/(protected)/admin/users/AdminUsersClient/hooks/useAdminUsersDirectory";
import type { AdminUserRow } from "@/app/(protected)/admin/users/AdminUsersClient/types/adminUsersTypes";

function createUser(id: number, overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id,
    email: `runner-${id}@example.com`,
    name: "Пользователь",
    lastName: String(id),
    gender: "male",
    login: `runner-${id}`,
    role: "athlete",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: null,
    ...overrides,
  };
}

describe("useAdminUsersDirectory", () => {
  it("управляет пагинацией, поиском и сбрасывает страницу при изменении запроса", async () => {
    const users = Array.from({ length: 12 }, (_, index) => createUser(index + 1));
    const { result } = renderHook(() => useAdminUsersDirectory(users));

    expect(result.current.stats.total).toBe(12);
    expect(result.current.visibleUsers).toHaveLength(10);
    expect(result.current.filteredUsersCount).toBe(12);

    act(() => {
      result.current.updatePage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.visibleUsers.map((user) => user.id)).toEqual([11, 12]);

    act(() => {
      result.current.updateQuery("Пользователь 12");
    });

    await waitFor(() => {
      expect(result.current.isSearchPending).toBe(false);
      expect(result.current.filteredUsersCount).toBe(1);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.visibleUsers[0]?.id).toBe(12);
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.resetFilters();
    });

    await waitFor(() => {
      expect(result.current.filteredUsersCount).toBe(12);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("совмещает фильтры роли и статуса", () => {
    const users = [
      createUser(1, { role: "coach", isActive: true }),
      createUser(2, { role: "coach", isActive: false }),
      createUser(3, { role: "athlete", isActive: false }),
    ];
    const { result } = renderHook(() => useAdminUsersDirectory(users));

    act(() => {
      result.current.updateRoleFilter("coach");
      result.current.updateStatusFilter("disabled");
    });

    expect(result.current.filteredUsersCount).toBe(1);
    expect(result.current.visibleUsers[0]?.id).toBe(2);
  });
});
