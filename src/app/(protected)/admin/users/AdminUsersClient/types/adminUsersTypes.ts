import type { FormInstance } from "antd";

export type AdminUserRow = {
  id: number;
  name: string;
  lastName: string;
  gender: string;
  email: string;
  login: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string | null;
};

export type RoleMeta = {
  label: string;
  tone: "admin" | "coach" | "athlete" | "unknown";
};

export type AdminUsersClientProps = {
  users: AdminUserRow[];
  currentUserId: number | null;
};

export type AdminUserRoleFilter = "all" | "admin" | "coach" | "athlete";
export type AdminUserStatusFilter = "all" | "active" | "disabled";

export type AdminUsersStats = {
  total: number;
  active: number;
  coaches: number;
  disabled: number;
};

export type RestoreAdminUserFocus = () => void;
export type OpenAdminUserModal = (user: AdminUserRow, restoreFocus: RestoreAdminUserFocus) => void;

export type RoleFormValues = {
  role: string;
};

export type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export type RoleFormInstance = FormInstance<RoleFormValues>;
export type PasswordFormInstance = FormInstance<PasswordFormValues>;
