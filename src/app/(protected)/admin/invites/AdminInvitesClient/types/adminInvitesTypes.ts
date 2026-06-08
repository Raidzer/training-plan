import type { FormInstance } from "antd";

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
  role: "athlete" | "coach";
};

export type InviteMeta = {
  label: string;
  color?: string;
};

export type InviteStatusMeta = {
  label: string;
  color: string;
};

export type AdminInviteCreateResponse = {
  invite?: AdminInviteRow;
  token?: string;
};

export type InviteFormInstance = FormInstance<InviteFormValues>;
