import { DEFAULT_TIMEZONE } from "@/shared/constants/timezones";
import { ROLES } from "@/shared/constants";
import dayjs from "dayjs";
import { PROFILE_DATE_FORMAT } from "../constants/profileConstants";
import type {
  Occupation,
  ProfileApiUserData,
  ProfileFormValues,
  ProfilePayload,
  ProfileUserData,
} from "../types/profileTypes";

const normalizeOccupation = (occupation: string | null): Occupation | null => {
  if (occupation === "work" || occupation === "study") {
    return occupation;
  }

  return null;
};

export const normalizeProfileValues = (values: ProfileFormValues): ProfilePayload => ({
  name: values.name.trim(),
  lastName: values.lastName?.trim() ?? "",
  patronymic: values.patronymic?.trim() ?? "",
  heightCm: values.heightCm ?? null,
  gender: values.gender,
  dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format(PROFILE_DATE_FORMAT) : null,
  occupation: values.occupation ?? null,
  timezone: values.timezone,
});

export const toProfileFormValues = (userData: ProfileUserData): ProfileFormValues => ({
  name: userData.name,
  lastName: userData.lastName,
  patronymic: userData.patronymic,
  heightCm: userData.heightCm,
  gender: userData.gender === "female" ? "female" : "male",
  dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth, PROFILE_DATE_FORMAT) : null,
  occupation: normalizeOccupation(userData.occupation),
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
    normalizedDraft.dateOfBirth !== normalizedCurrent.dateOfBirth ||
    normalizedDraft.occupation !== normalizedCurrent.occupation ||
    normalizedDraft.timezone !== normalizedCurrent.timezone
  );
};

export const normalizeProfileUserData = (userData: ProfileApiUserData): ProfileUserData => ({
  ...userData,
  id: String(userData.id),
  lastName: userData.lastName ?? "",
  patronymic: userData.patronymic ?? "",
  heightCm: userData.heightCm ?? null,
  dateOfBirth: userData.dateOfBirth ?? null,
  occupation: userData.occupation ?? null,
  role: userData.role ?? "",
});

export const canDeleteProfileRole = (role: string) => {
  return role !== ROLES.ADMIN;
};

export async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}
