import { ADMIN_USERS_LABELS, ROLE_META } from "../constants/adminUsersConstants";
import type {
  AdminUserRoleFilter,
  AdminUserRow,
  AdminUsersStats,
  AdminUserStatusFilter,
} from "../types/adminUsersTypes";
import { ROLES } from "@/shared/constants";

export const getRoleMeta = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const meta = ROLE_META[normalized];

  if (meta) {
    return meta;
  }

  if (normalized.length === 0) {
    return { label: ADMIN_USERS_LABELS.unknownRole, tone: "unknown" as const };
  }

  return { label: value, tone: "unknown" as const };
};

export const formatDate = (value: string) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("ru-RU");
};

export const getUserLabel = (user: AdminUserRow) => {
  const fullName = [user.name, user.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email;
  }

  return `ID ${user.id}`;
};

export const getUserInitials = (user: AdminUserRow) => {
  const initials = [user.name, user.lastName]
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (initials) {
    return initials;
  }

  const fallback = user.email.trim().charAt(0) || user.login.trim().charAt(0);
  return fallback ? fallback.toUpperCase() : "—";
};

export const getRosterNumber = (userId: number) => {
  return String(userId).padStart(4, "0");
};

export const getGenderLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "male") {
    return ADMIN_USERS_LABELS.maleGender;
  }

  if (normalized === "female") {
    return ADMIN_USERS_LABELS.femaleGender;
  }

  return value || "-";
};

export const canDeleteAdminUser = (user: AdminUserRow) => {
  return user.role !== ROLES.ADMIN;
};

export const getAdminUsersStats = (users: AdminUserRow[]): AdminUsersStats => {
  return users.reduce<AdminUsersStats>(
    (stats, user) => ({
      total: stats.total + 1,
      active: stats.active + (user.isActive ? 1 : 0),
      coaches: stats.coaches + (user.role === ROLES.COACH ? 1 : 0),
      disabled: stats.disabled + (user.isActive ? 0 : 1),
    }),
    { total: 0, active: 0, coaches: 0, disabled: 0 }
  );
};

const normalizeSearchValue = (value: string) => {
  return value.trim().toLocaleLowerCase("ru-RU");
};

export const filterAdminUsers = (
  users: AdminUserRow[],
  query: string,
  roleFilter: AdminUserRoleFilter,
  statusFilter: AdminUserStatusFilter
) => {
  const normalizedQuery = normalizeSearchValue(query);

  return users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive);
    const searchableValue = [
      user.name,
      user.lastName,
      `${user.name} ${user.lastName}`,
      user.email,
      user.login,
      String(user.id),
    ]
      .join(" ")
      .toLocaleLowerCase("ru-RU");
    const matchesQuery = normalizedQuery.length === 0 || searchableValue.includes(normalizedQuery);

    return matchesRole && matchesStatus && matchesQuery;
  });
};

export const formatUsersCount = (count: number) => {
  const absoluteCount = Math.abs(count);
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;
  let noun = "пользователей";

  if (lastTwoDigits < 11 || lastTwoDigits > 14) {
    if (lastDigit === 1) {
      noun = "пользователь";
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      noun = "пользователя";
    }
  }

  return `${count} ${noun}`;
};

const getApiError = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (!("error" in value)) {
    return null;
  }

  const error = (value as { error?: unknown }).error;
  if (typeof error !== "string") {
    return null;
  }

  return error;
};

export const getApiErrorMessage = (value: unknown, fallback: string) => {
  const error = getApiError(value);

  if (!error) {
    return fallback;
  }

  switch (error) {
    case "unauthorized":
      return ADMIN_USERS_LABELS.unauthorized;
    case "forbidden":
      return ADMIN_USERS_LABELS.forbidden;
    case "invalid_payload":
      return ADMIN_USERS_LABELS.invalidPayload;
    case "invalid_user_id":
      return ADMIN_USERS_LABELS.invalidUserId;
    case "not_found":
      return ADMIN_USERS_LABELS.notFound;
    case "cannot_disable_self":
      return ADMIN_USERS_LABELS.cannotDisableSelf;
    case "forbidden_admin_delete":
      return ADMIN_USERS_LABELS.cannotDeleteAdmin;
    default:
      return fallback;
  }
};
