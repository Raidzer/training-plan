import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ADMIN_USERS_LABELS } from "@/app/admin/users/AdminUsersClient/constants/adminUsersConstants";
import { AdminUsersTable } from "@/app/admin/users/AdminUsersClient/components/AdminUsersTable/AdminUsersTable";
import type { AdminUserRow } from "@/app/admin/users/AdminUsersClient/types/adminUsersTypes";

function createUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 1,
    email: "runner@example.com",
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    login: "runner",
    role: "admin",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AdminUsersTable", () => {
  it("должен показывать пользователей и отправлять действия по строке", () => {
    const activeUser = createUser();
    const disabledUser = createUser({
      id: 2,
      email: "coach@example.com",
      name: "Анна",
      lastName: "",
      gender: "female",
      login: "",
      role: "unknown",
      isActive: false,
    });
    const onOpenRoleModal = vi.fn();
    const onOpenPasswordModal = vi.fn();
    const onStatusToggle = vi.fn();

    render(
      <AdminUsersTable
        rows={[activeUser, disabledUser]}
        savingStatusId={null}
        onOpenRoleModal={onOpenRoleModal}
        onOpenPasswordModal={onOpenPasswordModal}
        onStatusToggle={onStatusToggle}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Роль/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Пароль/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Отключить/ }));
    fireEvent.click(screen.getByRole("button", { name: /Включить/ }));

    expect(screen.getByText("Иван Петров")).toBeTruthy();
    expect(screen.getByText("runner@example.com")).toBeTruthy();
    expect(screen.getByText(ADMIN_USERS_LABELS.activeStatus)).toBeTruthy();
    expect(screen.getByText(ADMIN_USERS_LABELS.disabledStatus)).toBeTruthy();
    expect(onOpenRoleModal).toHaveBeenCalledWith(activeUser);
    expect(onOpenPasswordModal).toHaveBeenCalledWith(activeUser);
    expect(onStatusToggle).toHaveBeenNthCalledWith(1, activeUser);
    expect(onStatusToggle).toHaveBeenNthCalledWith(2, disabledUser);
  });
});
