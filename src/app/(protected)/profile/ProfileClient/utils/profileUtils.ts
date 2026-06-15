import { DEFAULT_TIMEZONE } from "@/shared/constants/timezones";
import { ROLES } from "@/shared/constants";
import type { ProfileApiUserData, ProfileFormValues, ProfileUserData } from "../types/profileTypes";

export const normalizeProfileValues = (values: ProfileFormValues): ProfileFormValues => ({
  name: values.name.trim(),
  lastName: values.lastName?.trim() ?? "",
  patronymic: values.patronymic?.trim() ?? "",
  heightCm: values.heightCm ?? null,
  gender: values.gender,
  timezone: values.timezone,
});

export const toProfileFormValues = (userData: ProfileUserData): ProfileFormValues => ({
  name: userData.name,
  lastName: userData.lastName,
  patronymic: userData.patronymic,
  heightCm: userData.heightCm,
  gender: userData.gender === "female" ? "female" : "male",
  timezone: userData.timezone || DEFAULT_TIMEZONE,
});

export const hasProfileValuesChanged = (
  currentValues: ProfileFormValues,
  draftValues: ProfileFormValues
) => {
  const normalizedCurrent = normalizeProfileValues(currentValues);
  const normalizedDraft = normalizeProfileValues(draftValues);

  return (
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.lastName !== normalizedCurrent.lastName ||
    normalizedDraft.patronymic !== normalizedCurrent.patronymic ||
    normalizedDraft.heightCm !== normalizedCurrent.heightCm ||
    normalizedDraft.gender !== normalizedCurrent.gender ||
    normalizedDraft.timezone !== normalizedCurrent.timezone
  );
};

export const normalizeProfileUserData = (userData: ProfileApiUserData): ProfileUserData => ({
  ...userData,
  id: String(userData.id),
  lastName: userData.lastName ?? "",
  patronymic: userData.patronymic ?? "",
  heightCm: userData.heightCm ?? null,
  role: userData.role ?? "",
});

export const canDeleteProfileRole = (role: string) => {
  return role !== ROLES.ADMIN;
};

export async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}
