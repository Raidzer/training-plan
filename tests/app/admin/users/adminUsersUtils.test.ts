import { describe, expect, it } from "vitest";

import {
  canDeleteAdminUser,
  formatDate,
  getApiErrorMessage,
  getGenderLabel,
  getRoleMeta,
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
