import { ADMIN_INVITES_LABELS, ROLE_META } from "../constants/adminInvitesConstants";
import type {
  AdminInviteCreateResponse,
  AdminInviteRow,
  AdminInvitesStats,
  InviteMeta,
  InviteRoleFilter,
  InviteStatus,
  InviteStatusFilter,
  InviteUser,
} from "../types/adminInvitesTypes";

export const formatDate = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const getUserLabel = (user: InviteUser | null) => {
  if (!user) {
    return "—";
  }

  if (user.name) {
    return user.name;
  }

  if (user.email) {
    return user.email;
  }

  return `ID ${user.id}`;
};

export const getInviteNumber = (id: number) => `#${String(id).padStart(4, "0")}`;

export const getRoleMeta = (role: string): InviteMeta =>
  ROLE_META[role] ?? {
    label: role || ADMIN_INVITES_LABELS.unknownRole,
    tone: "unknown",
  };

export const getCurrentInviteStatus = (
  invite: AdminInviteRow,
  now: number = Date.now()
): InviteStatus => {
  if (invite.status === "used" || invite.usedAt || invite.usedBy) {
    return "used";
  }

  if (invite.status === "expired") {
    return "expired";
  }

  const expiresAt = Date.parse(invite.expiresAt);
  if (Number.isNaN(expiresAt)) {
    return invite.status;
  }

  if (expiresAt <= now) {
    return "expired";
  }

  return "active";
};

export const getAdminInvitesStats = (invites: AdminInviteRow[]): AdminInvitesStats => {
  const stats: AdminInvitesStats = {
    total: invites.length,
    active: 0,
    used: 0,
    expired: 0,
  };

  for (const invite of invites) {
    stats[invite.status] += 1;
  }

  return stats;
};

const normalizeSearchValue = (value: string) => value.trim().toLocaleLowerCase("ru-RU");

const getInviteSearchText = (invite: AdminInviteRow) => {
  const createdBy = invite.createdBy;
  const usedBy = invite.usedBy;
  const roleMeta = getRoleMeta(invite.role);

  return [
    String(invite.id),
    getInviteNumber(invite.id),
    invite.role,
    roleMeta.label,
    createdBy?.name,
    createdBy?.email,
    usedBy?.name,
    usedBy?.email,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("ru-RU");
};

export const filterAdminInvites = (
  invites: AdminInviteRow[],
  query: string,
  roleFilter: InviteRoleFilter,
  statusFilter: InviteStatusFilter
) => {
  const normalizedQuery = normalizeSearchValue(query);

  return invites.filter((invite) => {
    const matchesQuery =
      normalizedQuery.length === 0 || getInviteSearchText(invite).includes(normalizedQuery);
    const matchesRole = roleFilter === "all" || invite.role === roleFilter;
    const matchesStatus = statusFilter === "all" || invite.status === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });
};

export const formatInvitesCount = (count: number) => {
  const absoluteCount = Math.abs(count);
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;
  let noun = "приглашений";

  if (lastTwoDigits < 11 || lastTwoDigits > 14) {
    if (lastDigit === 1) {
      noun = "приглашение";
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      noun = "приглашения";
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
