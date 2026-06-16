import type { FormInstance } from "antd";
import type { Dayjs } from "dayjs";

export type Gender = "male" | "female";
export type Occupation = "work" | "study";

export type ProfileUserData = {
  id: string;
  email: string;
  login: string;
  name: string;
  lastName: string;
  patronymic: string;
  heightCm: number | null;
  gender: string;
  dateOfBirth: string | null;
  occupation: string | null;
  timezone: string;
  role: string;
};

export type ProfileApiUserData = Omit<
  ProfileUserData,
  "id" | "lastName" | "patronymic" | "heightCm" | "dateOfBirth" | "occupation" | "role"
> & {
  id: string | number;
  lastName?: string | null;
  patronymic?: string | null;
  heightCm?: number | null;
  dateOfBirth?: string | null;
  occupation?: string | null;
  role?: string;
};

export type ProfileFormValues = {
  name: string;
  lastName: string;
  patronymic: string;
  heightCm: number | null;
  gender: Gender;
  dateOfBirth: Dayjs | null;
  occupation: Occupation | null;
  timezone: string;
};

export type ProfilePayload = {
  name: string;
  lastName: string;
  patronymic: string;
  heightCm: number | null;
  gender: Gender;
  dateOfBirth: string | null;
  occupation: Occupation | null;
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
