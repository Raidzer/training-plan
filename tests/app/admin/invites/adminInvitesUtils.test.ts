import { afterEach, describe, expect, it } from "vitest";

import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";
import type { AdminInviteRow } from "@/app/(protected)/admin/invites/AdminInvitesClient/types/adminInvitesTypes";
import {
  buildInviteUrl,
  filterAdminInvites,
  formatDate,
  formatInvitesCount,
  getAdminInvitesStats,
  getApiErrorMessage,
  getCreatedInviteData,
  getInviteNumber,
  getRoleMeta,
  getUserLabel,
} from "@/app/(protected)/admin/invites/AdminInvitesClient/utils/adminInvitesUtils";

function createInvite(overrides: Partial<AdminInviteRow> = {}): AdminInviteRow {
  return {
    id: 1,
    role: "athlete",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-02-01T00:00:00.000Z",
    usedAt: null,
    status: "active",
    createdBy: null,
    usedBy: null,
    ...overrides,
  };
}

const invite = createInvite();
const originalWindow = globalThis.window;

describe("adminInvitesUtils", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("форматирует даты и подписи пользователей с безопасными fallback", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("bad-date")).toBe("—");
    expect(formatDate("2026-01-01T00:00:00.000Z")).not.toBe("—");
    expect(getUserLabel(null)).toBe("—");
    expect(getUserLabel({ id: 1, email: "", name: "Admin" })).toBe("Admin");
    expect(getUserLabel({ id: 1, email: "admin@example.com", name: "" })).toBe("admin@example.com");
    expect(getUserLabel({ id: 1, email: "", name: "" })).toBe("ID 1");
  });

  it("формирует номер приглашения и метаданные известных и неизвестных ролей", () => {
    expect(getInviteNumber(7)).toBe("#0007");
    expect(getRoleMeta("athlete")).toEqual({ label: "Атлет", tone: "athlete" });
    expect(getRoleMeta("custom")).toEqual({ label: "custom", tone: "unknown" });
    expect(getRoleMeta("")).toEqual({
      label: ADMIN_INVITES_LABELS.unknownRole,
      tone: "unknown",
    });
  });

  it("считает сводку по всем статусам", () => {
    const invites = [
      createInvite({ id: 1, status: "active" }),
      createInvite({ id: 2, status: "active" }),
      createInvite({ id: 3, status: "used" }),
      createInvite({ id: 4, status: "expired" }),
    ];

    expect(getAdminInvitesStats(invites)).toEqual({
      total: 4,
      active: 2,
      used: 1,
      expired: 1,
    });
    expect(getAdminInvitesStats([])).toEqual({
      total: 0,
      active: 0,
      used: 0,
      expired: 0,
    });
  });

  it("ищет по номеру, роли, создателю и получателю без учёта регистра", () => {
    const invites = [
      createInvite({
        id: 12,
        role: "athlete",
        createdBy: { id: 10, name: "Анна Админ", email: "admin@example.com" },
      }),
      createInvite({
        id: 25,
        role: "coach",
        status: "used",
        usedBy: { id: 20, name: "Иван Бегун", email: "runner@example.com" },
      }),
    ];

    expect(filterAdminInvites(invites, "  #0012 ", "all", "all").map((row) => row.id)).toEqual([
      12,
    ]);
    expect(filterAdminInvites(invites, "АННА", "all", "all").map((row) => row.id)).toEqual([12]);
    expect(filterAdminInvites(invites, "тренер", "all", "all").map((row) => row.id)).toEqual([25]);
    expect(
      filterAdminInvites(invites, "RUNNER@EXAMPLE.COM", "all", "all").map((row) => row.id)
    ).toEqual([25]);
  });

  it("совмещает запрос с фильтрами роли и статуса", () => {
    const invites = [
      createInvite({ id: 1, role: "coach", status: "active" }),
      createInvite({ id: 2, role: "coach", status: "expired" }),
      createInvite({ id: 3, role: "athlete", status: "expired" }),
    ];

    expect(filterAdminInvites(invites, "", "coach", "expired").map((row) => row.id)).toEqual([2]);
    expect(filterAdminInvites(invites, "#0003", "coach", "expired")).toEqual([]);
  });

  it.each([
    [0, "0 приглашений"],
    [1, "1 приглашение"],
    [2, "2 приглашения"],
    [4, "4 приглашения"],
    [5, "5 приглашений"],
    [11, "11 приглашений"],
    [21, "21 приглашение"],
    [22, "22 приглашения"],
    [25, "25 приглашений"],
  ])("склоняет счётчик %i", (count, expected) => {
    expect(formatInvitesCount(count)).toBe(expected);
  });

  it("возвращает понятные API-ошибки и fallback", () => {
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

  it("строит invite URL только в браузере", () => {
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

  it("читает данные созданного приглашения из API-ответа", () => {
    expect(getCreatedInviteData(null)).toBeNull();
    expect(getCreatedInviteData({ invite })).toBeNull();
    expect(getCreatedInviteData({ invite: null, token: "token" })).toBeNull();
    expect(getCreatedInviteData({ invite, token: "token" })).toEqual({
      invite,
      token: "token",
    });
  });
});
