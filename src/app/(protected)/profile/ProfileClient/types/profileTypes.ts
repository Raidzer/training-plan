import type { FormInstance } from "antd";

export type Gender = "male" | "female";

export type ProfileUserData = {
  id: string;
  email: string;
  login: string;
  name: string;
  lastName: string;
  gender: string;
  timezone: string;
  role: string;
};

export type ProfileApiUserData = Omit<ProfileUserData, "id" | "lastName" | "role"> & {
  id: string | number;
  lastName?: string | null;
  role?: string;
};

export type ProfileFormValues = {
  name: string;
  lastName: string;
  gender: Gender;
  timezone: string;
};

export type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type EmailFormValues = {
  email: string;
  currentPassword: string;
};

export type DeleteProfileFormValues = {
  currentPassword: string;
};

export type ProfileApiResponse = {
  success?: boolean;
  error?: string;
  user?: ProfileApiUserData;
};

export type PasswordApiResponse = {
  success?: boolean;
  error?: string;
};

export type EmailApiResponse = {
  success?: boolean;
  emailSent?: boolean;
  error?: string;
  user?: ProfileApiUserData;
};

export type DeleteProfileApiResponse = {
  success?: boolean;
  error?: string;
};

export type ProfileClientProps = {
  userData: ProfileUserData;
};

export type ProfileFormInstance = FormInstance<ProfileFormValues>;
export type EmailFormInstance = FormInstance<EmailFormValues>;
export type PasswordFormInstance = FormInstance<PasswordFormValues>;
export type DeleteProfileFormInstance = FormInstance<DeleteProfileFormValues>;
