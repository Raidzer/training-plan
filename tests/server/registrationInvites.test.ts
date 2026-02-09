import { describe, expect, it } from "vitest";
import {
  buildInviteExpiry,
  generateInviteToken,
  hashInviteToken,
} from "@/server/registrationInvites";

describe("server/registrationInvites", () => {
  it("buildInviteExpiry должен добавлять 24 часа", () => {
    const now = new Date("2026-02-09T10:00:00.000Z");

    const expiry = buildInviteExpiry(now);

    expect(expiry.toISOString()).toBe("2026-02-10T10:00:00.000Z");
  });

  it("generateInviteToken должен возвращать непустой случайный токен", () => {
    const tokenA = generateInviteToken();
    const tokenB = generateInviteToken();

    expect(tokenA.length).toBeGreaterThan(20);
    expect(tokenB.length).toBeGreaterThan(20);
    expect(tokenA).not.toBe(tokenB);
  });

  it("hashInviteToken должен возвращать детерминированный sha256-хеш", () => {
    const token = "invite-token";

    const hashA = hashInviteToken(token);
    const hashB = hashInviteToken(token);

    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });
});
