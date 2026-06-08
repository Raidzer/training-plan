import { afterEach, describe, expect, it } from "vitest";

import {
  buildInviteUrl,
  formatDate,
  getApiErrorMessage,
  getCreatedInviteData,
  getUserLabel,
} from "@/app/(protected)/admin/invites/AdminInvitesClient/utils/adminInvitesUtils";
import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";
import type { AdminInviteRow } from "@/app/(protected)/admin/invites/AdminInvitesClient/types/adminInvitesTypes";

const invite: AdminInviteRow = {
  id: 1,
  role: "athlete",
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-02-01T00:00:00.000Z",
  usedAt: null,
  status: "active",
  createdBy: null,
  usedBy: null,
};

const originalWindow = globalThis.window;

describe("adminInvitesUtils", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("должен форматировать даты и пользователей", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("bad-date")).toBe("-");
    expect(formatDate("2026-01-01T00:00:00.000Z")).not.toBe("-");
    expect(getUserLabel(null)).toBe("-");
    expect(getUserLabel({ id: 1, email: "", name: "Admin" })).toBe("Admin");
    expect(getUserLabel({ id: 1, email: "admin@example.com", name: "" })).toBe("admin@example.com");
    expect(getUserLabel({ id: 1, email: "", name: "" })).toBe("ID 1");
  });

  it("должен возвращать понятные API-ошибки и fallback", () => {
    expect(getApiErrorMessage({ error: "unauthorized" }, "fallback")).toBe(
      ADMIN_INVITES_LABELS.unauthorized
    );
    expect(getApiErrorMessage({ error: "forbidden" }, "fallback")).toBe(
      ADMIN_INVITES_LABELS.forbidden
    );
    expect(getApiErrorMessage({ error: "invalid_payload" }, "fallback")).toBe(
      ADMIN_INVITES_LABELS.invalidPayload
    );
    expect(getApiErrorMessage({ error: "create_failed" }, "fallback")).toBe(
      ADMIN_INVITES_LABELS.createFail
    );
    expect(getApiErrorMessage({ error: "unknown" }, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({}, "fallback")).toBe("fallback");
  });

  it("должен строить invite URL только в браузере", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });

    expect(buildInviteUrl("token")).toBe("");

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          origin: "https://training.example",
        },
      },
    });

    expect(buildInviteUrl("token")).toBe("https://training.example/register?invite=token");
  });

  it("должен читать данные созданного приглашения из API-ответа", () => {
    expect(getCreatedInviteData(null)).toBeNull();
    expect(getCreatedInviteData({ invite })).toBeNull();
    expect(getCreatedInviteData({ invite: null, token: "token" })).toBeNull();
    expect(getCreatedInviteData({ invite, token: "token" })).toEqual({
      invite,
      token: "token",
    });
  });
});
