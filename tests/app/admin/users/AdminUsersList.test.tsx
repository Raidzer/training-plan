import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
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

import { AdminUsersList } from "@/app/(protected)/admin/users/AdminUsersClient/components/AdminUsersList/AdminUsersList";
import { ADMIN_USERS_LABELS } from "@/app/(protected)/admin/users/AdminUsersClient/constants/adminUsersConstants";
import type { AdminUserRow } from "@/app/(protected)/admin/users/AdminUsersClient/types/adminUsersTypes";

function createUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 1,
    email: "test@example.com",
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    login: "runner",
    role: "athlete",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: "2026-06-12T10:00:00.000Z",
    ...overrides,
  };
}

function getUserCard(name: string) {
  const heading = screen.getByRole("heading", { level: 3, name });
  const card = heading.closest("article");

  if (!card) {
    throw new Error(`Карточка пользователя не найдена: ${name}`);
  }

  return card as HTMLElement;
}

function renderUsersList(
  users: AdminUserRow[],
  overrides: Partial<ComponentProps<typeof AdminUsersList>> = {}
) {
  const props: ComponentProps<typeof AdminUsersList> = {
    users,
    totalResults: users.length,
    currentPage: 1,
    currentUserId: null,
    hasActiveFilters: false,
    savingStatusId: null,
    clearingUserDataId: null,
    deletingUserId: null,
    onPageChange: vi.fn(),
    onResetFilters: vi.fn(),
    onOpenRoleModal: vi.fn(),
    onOpenPasswordModal: vi.fn(),
    onStatusToggle: vi.fn(),
    onClearUserTrainingData: vi.fn(),
    onDeleteUser: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<AdminUsersList {...props} />),
    props,
  };
}

describe("AdminUsersList", () => {
  it("показывает карточку, контекстное меню, ссылки и передаёт пользователя в действия", () => {
    const user = createUser();
    const { props } = renderUsersList([user]);
    const card = getUserCard("Иван Петров");

    expect(within(card).getByText("test@example.com")).toBeTruthy();
    const actionsButton = within(card).getByRole("button", {
      name: `${ADMIN_USERS_LABELS.actionsMenuButton}: Иван Петров, участник 0001`,
    });

    expect(actionsButton).toBeTruthy();
    expect(
      within(card)
        .getByRole("link", { name: ADMIN_USERS_LABELS.recordsButton })
        .getAttribute("href")
    ).toBe("/admin/users/1/records");
    expect(
      within(card)
        .getByRole("link", { name: ADMIN_USERS_LABELS.competitionsButton })
        .getAttribute("href")
    ).toBe("/admin/users/1/competitions");

    fireEvent.click(actionsButton);
    fireEvent.click(within(card).getByRole("menuitem", { name: ADMIN_USERS_LABELS.roleButton }));
    fireEvent.click(
      within(card).getByRole("menuitem", { name: ADMIN_USERS_LABELS.passwordButton })
    );
    fireEvent.click(within(card).getByRole("menuitem", { name: ADMIN_USERS_LABELS.disableButton }));
    fireEvent.click(
      within(card).getByRole("menuitem", {
        name: ADMIN_USERS_LABELS.clearTrainingDataButton,
      })
    );
    fireEvent.click(within(card).getByRole("menuitem", { name: ADMIN_USERS_LABELS.deleteButton }));

    expect(props.onOpenRoleModal).toHaveBeenCalledWith(user, expect.any(Function));
    expect(props.onOpenPasswordModal).toHaveBeenCalledWith(user, expect.any(Function));

    const restoreFocus = (props.onOpenRoleModal as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    restoreFocus?.();

    expect(document.activeElement).toBe(actionsButton);
    expect(props.onStatusToggle).toHaveBeenCalledWith(user);
    expect(props.onClearUserTrainingData).toHaveBeenCalledWith(user);
    expect(props.onDeleteUser).toHaveBeenCalledWith(user);
  });

  it("блокирует удаление администратора и отключение текущего пользователя", () => {
    const admin = createUser({
      id: 1,
      name: "Анна",
      lastName: "Администратор",
      role: "admin",
    });
    const currentUser = createUser({
      id: 2,
      name: "Олег",
      lastName: "Тренер",
      role: "coach",
    });
    const { props } = renderUsersList([admin, currentUser], { currentUserId: currentUser.id });
    const adminCard = getUserCard("Анна Администратор");
    const currentUserCard = getUserCard("Олег Тренер");
    const adminDeleteItem = within(adminCard).getByRole("menuitem", {
      name: ADMIN_USERS_LABELS.deleteButton,
    });
    const currentUserDisableItem = within(currentUserCard).getByRole("menuitem", {
      name: new RegExp(ADMIN_USERS_LABELS.disableButton),
    });

    fireEvent.click(adminDeleteItem);
    fireEvent.click(currentUserDisableItem);

    expect(adminDeleteItem.getAttribute("aria-disabled")).toBe("true");
    expect(currentUserDisableItem.getAttribute("aria-disabled")).toBe("true");
    expect(within(currentUserCard).getByText(ADMIN_USERS_LABELS.currentUserBadge)).toBeTruthy();
    expect(props.onDeleteUser).not.toHaveBeenCalled();
    expect(props.onStatusToggle).not.toHaveBeenCalled();
  });

  it("показывает отдельные пустые состояния для фильтров и пустого клуба", () => {
    const onResetFilters = vi.fn();
    const { rerender } = render(
      <AdminUsersList
        users={[]}
        totalResults={0}
        currentPage={1}
        currentUserId={null}
        hasActiveFilters
        savingStatusId={null}
        clearingUserDataId={null}
        deletingUserId={null}
        onPageChange={vi.fn()}
        onResetFilters={onResetFilters}
        onOpenRoleModal={vi.fn()}
        onOpenPasswordModal={vi.fn()}
        onStatusToggle={vi.fn()}
        onClearUserTrainingData={vi.fn()}
        onDeleteUser={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: ADMIN_USERS_LABELS.resetFiltersButton }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: ADMIN_USERS_LABELS.emptySearchTitle })).toBeTruthy();

    rerender(
      <AdminUsersList
        users={[]}
        totalResults={0}
        currentPage={1}
        currentUserId={null}
        hasActiveFilters={false}
        savingStatusId={null}
        clearingUserDataId={null}
        deletingUserId={null}
        onPageChange={vi.fn()}
        onResetFilters={onResetFilters}
        onOpenRoleModal={vi.fn()}
        onOpenPasswordModal={vi.fn()}
        onStatusToggle={vi.fn()}
        onClearUserTrainingData={vi.fn()}
        onDeleteUser={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: ADMIN_USERS_LABELS.emptyUsersTitle })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: ADMIN_USERS_LABELS.invitesButton }).getAttribute("href")
    ).toBe("/admin/invites");
  });
});
