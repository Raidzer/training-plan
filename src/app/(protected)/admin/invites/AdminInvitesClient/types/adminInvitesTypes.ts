import type { FormInstance } from "antd";

export type InviteRole = "athlete" | "coach";

export type InviteUser = {
  id: number;
  name: string;
  email: string;
};

export type InviteStatus = "active" | "used" | "expired";

export type AdminInviteRow = {
  id: number;
  role: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: InviteStatus;
  createdBy: InviteUser | null;
  usedBy: InviteUser | null;
};

export type AdminInvitesClientProps = {
  invites: AdminInviteRow[];
};

export type InviteFormValues = {
  role: InviteRole;
};

export type InviteMeta = {
  label: string;
  tone: InviteRole | "unknown";
};

export type InviteStatusMeta = {
  label: string;
  tone: InviteStatus;
};

export type InviteRoleFilter = "all" | InviteRole;

export type InviteStatusFilter = "all" | InviteStatus;

export type AdminInvitesStats = {
  total: number;
  active: number;
  used: number;
  expired: number;
};

export type AdminInviteCreateResponse = {
  invite?: AdminInviteRow;
  token?: string;
};

export type InviteFormInstance = FormInstance<InviteFormValues>;
