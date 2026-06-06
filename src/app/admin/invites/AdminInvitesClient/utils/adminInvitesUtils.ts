import { ADMIN_INVITES_LABELS } from "../constants/adminInvitesConstants";
import type {
  AdminInviteCreateResponse,
  AdminInviteRow,
  InviteUser,
} from "../types/adminInvitesTypes";

export const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("ru-RU");
};

export const getUserLabel = (user: InviteUser | null) => {
  if (!user) {
    return "-";
  }

  if (user.name) {
    return user.name;
  }

  if (user.email) {
    return user.email;
  }

  return `ID ${user.id}`;
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
      return ADMIN_INVITES_LABELS.unauthorized;
    case "forbidden":
      return ADMIN_INVITES_LABELS.forbidden;
    case "invalid_payload":
      return ADMIN_INVITES_LABELS.invalidPayload;
    case "create_failed":
      return ADMIN_INVITES_LABELS.createFail;
    default:
      return fallback;
  }
};

export const buildInviteUrl = (token: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/register?invite=${token}`;
};

export const getCreatedInviteData = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const { invite, token } = data as AdminInviteCreateResponse;
  if (!invite || typeof token !== "string") {
    return null;
  }

  return {
    invite: invite as AdminInviteRow,
    token,
  };
};
