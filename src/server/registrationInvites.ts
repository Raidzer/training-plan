import { createHash, randomBytes } from "crypto";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export const buildInviteExpiry = (now: Date = new Date()) => {
  return new Date(now.getTime() + INVITE_TTL_MS);
};

export const generateInviteToken = () => {
  return randomBytes(32).toString("base64url");
};

export const hashInviteToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};
