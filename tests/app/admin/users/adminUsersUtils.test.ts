import { describe, expect, it } from "vitest";

import {
  canDeleteAdminUser,
  filterAdminUsers,
  formatDate,
  formatUsersCount,
  getAdminUsersStats,
  getApiErrorMessage,
  getGenderLabel,
  getRoleMeta,
  getRosterNumber,
  getUserInitials,
  getUserLabel,
} from "@/app/(protected)/admin/users/AdminUsersClient/utils/adminUsersUtils";
import { ADMIN_USERS_LABELS } from "@/app/(protected)/admin/users/AdminUsersClient/constants/adminUsersConstants";
import type { AdminUserRow } from "@/app/(protected)/admin/users/AdminUsersClient/types/adminUsersTypes";

const baseUser: AdminUserRow = {
  id: 10,
  email: "",
  name: "",
  lastName: "",
  gender: "",
  login: "",
  role: "user",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  lastActiveAt: null,
};

describe("adminUsersUtils", () => {
  it("должен возвращать метаданные роли и fallback для неизвестных ролей", () => {
    expect(getRoleMeta(" admin ").label).toBeTruthy();
    expect(getRoleMeta("")).toMatchObject({ label: ADMIN_USERS_LABELS.unknownRole });
    expect(getRoleMeta("custom")).toMatchObject({ label: "custom" });
  });

  it("должен форматировать даты и пользовательские подписи", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate("bad-date")).toBe("-");
    expect(formatDate("2026-01-01T00:00:00.000Z")).not.toBe("-");
    expect(getUserLabel({ ...baseUser, name: "Runner" })).toBe("Runner");
    expect(getUserLabel({ ...baseUser, email: "runner@example.com" })).toBe("runner@example.com");
    expect(getUserLabel(baseUser)).toBe("ID 10");
    expect(getUserLabel({ ...baseUser, name: "Анна", lastName: "Иванова" })).toBe("Анна Иванова");
    expect(getUserInitials({ ...baseUser, name: "Анна", lastName: "Иванова" })).toBe("АИ");
    expect(getUserInitials({ ...baseUser, email: "runner@example.com" })).toBe("R");
    expect(getRosterNumber(7)).toBe("0007");
  });

  it("фильтрует пользователей по запросу, роли и статусу", () => {
    const users: AdminUserRow[] = [
      {
        ...baseUser,
        id: 1,
        name: "Иван",
        lastName: "Петров",
        email: "ivan@example.com",
        login: "runner-one",
        role: "admin",
        isActive: true,
      },
      {
        ...baseUser,
        id: 2,
        name: "Анна",
        lastName: "Сидорова",
        email: "anna@example.com",
        login: "coach-two",
        role: "coach",
        isActive: false,
      },
      {
        ...baseUser,
        id: 3,
        name: "Олег",
        lastName: "Волков",
        email: "oleg@example.com",
        login: "athlete-three",
        role: "athlete",
        isActive: true,
      },
    ];

    expect(filterAdminUsers(users, "  АННА СИДОРОВА ", "all", "all")).toEqual([users[1]]);
    expect(filterAdminUsers(users, "runner-one", "all", "all")).toEqual([users[0]]);
    expect(filterAdminUsers(users, "2", "all", "all")).toEqual([users[1]]);
    expect(filterAdminUsers(users, "", "coach", "all")).toEqual([users[1]]);
    expect(filterAdminUsers(users, "", "all", "disabled")).toEqual([users[1]]);
    expect(filterAdminUsers(users, "", "athlete", "active")).toEqual([users[2]]);
    expect(filterAdminUsers(users, "Анна", "athlete", "all")).toEqual([]);
  });

  it("считает сводку по составу клуба", () => {
    const users: AdminUserRow[] = [
      { ...baseUser, id: 1, role: "admin", isActive: true },
      { ...baseUser, id: 2, role: "coach", isActive: true },
      { ...baseUser, id: 3, role: "coach", isActive: false },
      { ...baseUser, id: 4, role: "athlete", isActive: false },
    ];

    expect(getAdminUsersStats(users)).toEqual({
      total: 4,
      active: 2,
      coaches: 2,
      disabled: 2,
    });
    expect(getAdminUsersStats([])).toEqual({
      total: 0,
      active: 0,
      coaches: 0,
      disabled: 0,
    });
  });

  it.each([
    [0, "0 пользователей"],
    [1, "1 пользователь"],
    [2, "2 пользователя"],
    [4, "4 пользователя"],
    [5, "5 пользователей"],
    [11, "11 пользователей"],
    [14, "14 пользователей"],
    [21, "21 пользователь"],
    [22, "22 пользователя"],
    [25, "25 пользователей"],
  ])("склоняет количество пользователей: %i", (count, expected) => {
    expect(formatUsersCount(count)).toBe(expected);
  });

  it("должен форматировать пол и API-ошибки", () => {
    expect(getGenderLabel("male")).toBe(ADMIN_USERS_LABELS.maleGender);
    expect(getGenderLabel("female")).toBe(ADMIN_USERS_LABELS.femaleGender);
    expect(getGenderLabel("")).toBe("-");
    expect(getGenderLabel("other")).toBe("other");
    expect(getApiErrorMessage({ error: "unauthorized" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.unauthorized
    );
    expect(getApiErrorMessage({ error: "forbidden" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.forbidden
    );
    expect(getApiErrorMessage({ error: "invalid_payload" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.invalidPayload
    );
    expect(getApiErrorMessage({ error: "invalid_user_id" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.invalidUserId
    );
    expect(getApiErrorMessage({ error: "not_found" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.notFound
    );
    expect(getApiErrorMessage({ error: "cannot_disable_self" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.cannotDisableSelf
    );
    expect(getApiErrorMessage({ error: "forbidden_admin_delete" }, "fallback")).toBe(
      ADMIN_USERS_LABELS.cannotDeleteAdmin
    );
    expect(getApiErrorMessage({ error: "unknown" }, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({ error: 1 }, "fallback")).toBe("fallback");
    expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("запрещает удаление администратора", () => {
    expect(canDeleteAdminUser({ ...baseUser, role: "athlete" })).toBe(true);
    expect(canDeleteAdminUser({ ...baseUser, role: "coach" })).toBe(true);
    expect(canDeleteAdminUser({ ...baseUser, role: "admin" })).toBe(false);
  });
});
