import { ADMIN_USERS_LABELS, ROLE_META } from "../constants/adminUsersConstants";
import type { AdminUserRow } from "../types/adminUsersTypes";

export const getRoleMeta = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const meta = ROLE_META[normalized];

  if (meta) {
    return meta;
  }

  if (normalized.length === 0) {
    return { label: ADMIN_USERS_LABELS.unknownRole };
  }

  return { label: value };
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
  if (user.name) {
    return user.name;
  }

  if (user.email) {
    return user.email;
  }

  return `ID ${user.id}`;
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
    default:
      return fallback;
  }
};
