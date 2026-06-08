import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ADMIN_USERS_LABELS } from "@/app/(protected)/admin/users/AdminUsersClient/constants/adminUsersConstants";
import { AdminUsersTable } from "@/app/(protected)/admin/users/AdminUsersClient/components/AdminUsersTable/AdminUsersTable";
import type { AdminUserRow } from "@/app/(protected)/admin/users/AdminUsersClient/types/adminUsersTypes";

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

const ROLE_ACTION_INDEX = 1;
const PASSWORD_ACTION_INDEX = 2;
const STATUS_ACTION_INDEX = 3;

function clickRowAction(container: HTMLElement, rowIndex: number, actionIndex: number) {
  const row = container.querySelectorAll("tbody tr.ant-table-row")[rowIndex];
  if (!row) {
    throw new Error(`Table row not found: ${rowIndex}`);
  }

  const button = row.querySelectorAll("button")[actionIndex];
  if (!button) {
    throw new Error(`Row action not found: ${rowIndex}/${actionIndex}`);
  }
  fireEvent.click(button);
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

    const { container } = render(
      <AdminUsersTable
        rows={[activeUser, disabledUser]}
        savingStatusId={null}
        onOpenRoleModal={onOpenRoleModal}
        onOpenPasswordModal={onOpenPasswordModal}
        onStatusToggle={onStatusToggle}
      />
    );

    clickRowAction(container, 0, ROLE_ACTION_INDEX);
    clickRowAction(container, 0, PASSWORD_ACTION_INDEX);
    clickRowAction(container, 0, STATUS_ACTION_INDEX);
    clickRowAction(container, 1, STATUS_ACTION_INDEX);

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
