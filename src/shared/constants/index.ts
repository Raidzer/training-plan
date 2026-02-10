export const ROLES = {
  ATHLETE: "athlete",
  COACH: "coach",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
