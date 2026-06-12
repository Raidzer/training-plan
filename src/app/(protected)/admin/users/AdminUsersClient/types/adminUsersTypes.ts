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
  color?: string;
};

export type AdminUsersClientProps = {
  users: AdminUserRow[];
};

export type RoleFormValues = {
  role: string;
};

export type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export type RoleFormInstance = FormInstance<RoleFormValues>;
export type PasswordFormInstance = FormInstance<PasswordFormValues>;
