import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  type TestMenuItem = {
    type?: string;
    disabled?: boolean;
    label?: ReactNode;
    onClick?: () => void;
  };

  return {
    ...actual,
    Dropdown: ({ children, menu }: { children: ReactNode; menu?: { items?: TestMenuItem[] } }) => (
      <div>
        {children}
        <div role="menu">
          {menu?.items?.map((item, index) => {
            if (item.type === "divider") {
              return <span key={`divider-${index}`} />;
            }

            return (
              <button
                key={`item-${index}`}
                type="button"
                role="menuitem"
                aria-disabled={item.disabled ? "true" : undefined}
                onClick={() => {
                  if (item.disabled) {
                    return;
                  }

                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    ),
  };
});

import { AdminUsersTable } from "@/app/(protected)/admin/users/AdminUsersClient/components/AdminUsersTable/AdminUsersTable";
import { ADMIN_USERS_LABELS } from "@/app/(protected)/admin/users/AdminUsersClient/constants/adminUsersConstants";
import type { AdminUserRow } from "@/app/(protected)/admin/users/AdminUsersClient/types/adminUsersTypes";
import { formatDate } from "@/app/(protected)/admin/users/AdminUsersClient/utils/adminUsersUtils";

function createUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 1,
    email: "test@example.com",
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    login: "runner",
    role: "admin",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: "2026-06-12T10:00:00.000Z",
    ...overrides,
  };
}

function getTableRow(container: HTMLElement, rowIndex: number) {
  const row = container.querySelectorAll("tbody tr.ant-table-row")[rowIndex];
  if (!row) {
    throw new Error(`Table row not found: ${rowIndex}`);
  }

  return row as HTMLElement;
}

async function clickRowMenuItem(container: HTMLElement, rowIndex: number, label: string) {
  const row = getTableRow(container, rowIndex);
  const item = await within(row).findByRole("menuitem", { name: label });
  fireEvent.click(item);
}

describe("AdminUsersTable", () => {
  it("должен показывать пользователей и отправлять действия по строке", async () => {
    const activeUser = createUser();
    const disabledUser = createUser({
      id: 2,
      email: "anna@example.com",
      name: "Анна",
      lastName: "",
      gender: "female",
      login: "",
      role: "unknown",
      isActive: false,
      lastActiveAt: null,
    });
    const onOpenRoleModal = vi.fn();
    const onOpenPasswordModal = vi.fn();
    const onStatusToggle = vi.fn();
    const onClearUserTrainingData = vi.fn();
    const onDeleteUser = vi.fn();

    const { container } = render(
      <AdminUsersTable
        rows={[activeUser, disabledUser]}
        savingStatusId={null}
        clearingUserDataId={null}
        deletingUserId={null}
        onOpenRoleModal={onOpenRoleModal}
        onOpenPasswordModal={onOpenPasswordModal}
        onStatusToggle={onStatusToggle}
        onClearUserTrainingData={onClearUserTrainingData}
        onDeleteUser={onDeleteUser}
      />
    );

    const activeUserRow = getTableRow(container, 0);
    const activeUserRecordsButton = within(activeUserRow).getByRole("button", {
      name: new RegExp(ADMIN_USERS_LABELS.recordsButton),
    }) as HTMLButtonElement;

    await clickRowMenuItem(container, 0, ADMIN_USERS_LABELS.roleButton);
    await clickRowMenuItem(container, 0, ADMIN_USERS_LABELS.passwordButton);
    await clickRowMenuItem(container, 0, ADMIN_USERS_LABELS.disableButton);
    await clickRowMenuItem(container, 1, ADMIN_USERS_LABELS.enableButton);
    await clickRowMenuItem(container, 1, ADMIN_USERS_LABELS.clearTrainingDataButton);
    await clickRowMenuItem(container, 1, ADMIN_USERS_LABELS.deleteButton);

    expect(screen.getByText("Иван Петров")).toBeTruthy();
    expect(screen.getByText("test@example.com")).toBeTruthy();
    expect(screen.getAllByText(ADMIN_USERS_LABELS.lastActiveAtColumn).length).toBeGreaterThan(0);
    expect(screen.getByText(formatDate(activeUser.lastActiveAt ?? ""))).toBeTruthy();
    expect(screen.getByText(ADMIN_USERS_LABELS.activeStatus)).toBeTruthy();
    expect(screen.getByText(ADMIN_USERS_LABELS.disabledStatus)).toBeTruthy();
    expect(activeUserRecordsButton.disabled).toBe(false);
    expect(onOpenRoleModal).toHaveBeenCalledWith(activeUser);
    expect(onOpenPasswordModal).toHaveBeenCalledWith(activeUser);
    expect(onStatusToggle).toHaveBeenNthCalledWith(1, activeUser);
    expect(onStatusToggle).toHaveBeenNthCalledWith(2, disabledUser);
    expect(onClearUserTrainingData).toHaveBeenCalledWith(disabledUser);
    expect(onDeleteUser).toHaveBeenCalledWith(disabledUser);
  });

  it("должен блокировать удаление администратора в меню действий", async () => {
    const activeUser = createUser();
    const onOpenRoleModal = vi.fn();
    const onOpenPasswordModal = vi.fn();
    const onStatusToggle = vi.fn();
    const onClearUserTrainingData = vi.fn();
    const onDeleteUser = vi.fn();

    const { container } = render(
      <AdminUsersTable
        rows={[activeUser]}
        savingStatusId={null}
        clearingUserDataId={null}
        deletingUserId={null}
        onOpenRoleModal={onOpenRoleModal}
        onOpenPasswordModal={onOpenPasswordModal}
        onStatusToggle={onStatusToggle}
        onClearUserTrainingData={onClearUserTrainingData}
        onDeleteUser={onDeleteUser}
      />
    );

    const row = getTableRow(container, 0);
    const deleteItem = await within(row).findByRole("menuitem", {
      name: ADMIN_USERS_LABELS.deleteButton,
    });
    fireEvent.click(deleteItem);

    expect(deleteItem.getAttribute("aria-disabled")).toBe("true");
    expect(onDeleteUser).not.toHaveBeenCalled();
  });
});
