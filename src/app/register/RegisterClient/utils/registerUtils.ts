import { REGISTER_TEXT } from "../constants/registerConstants";
import type { RegisterFields, RegisterPayload } from "../types/registerTypes";

const REGISTER_API_ERROR_MESSAGES: Record<string, string> = {
  invite_invalid: REGISTER_TEXT.inviteInvalid,
  invite_used: REGISTER_TEXT.inviteUsed,
  invite_expired: REGISTER_TEXT.inviteExpired,
  user_exists: REGISTER_TEXT.userExists,
  "Email or login already in use": REGISTER_TEXT.userExists,
};

export function trimRegisterField(value: string): string {
  return value.trim();
}

export function normalizeRegisterPayload(values: RegisterFields): RegisterPayload {
  const payload: RegisterPayload = {
    name: trimRegisterField(values.name),
    gender: values.gender,
    login: trimRegisterField(values.login),
    email: trimRegisterField(values.email),
    password: values.password,
    timezone: trimRegisterField(values.timezone),
  };

  if (values.lastName !== undefined) {
    payload.lastName = trimRegisterField(values.lastName);
  }

  return payload;
}

export function getRegisterErrorMessage(error: unknown): string {
  if (typeof error !== "string") {
    return REGISTER_TEXT.registerFailed;
  }

  return REGISTER_API_ERROR_MESSAGES[error] ?? REGISTER_TEXT.registerFailed;
}
