import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const {
  authMock,
  getTelegramAccountSummaryMock,
  getTelegramSubscriptionSummaryMock,
  getLatestTelegramLinkCodeSummaryMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getTelegramAccountSummaryMock: vi.fn(),
    getTelegramSubscriptionSummaryMock: vi.fn(),
    getLatestTelegramLinkCodeSummaryMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/telegram", () => {
  return {
    getTelegramAccountSummary: getTelegramAccountSummaryMock,
    getTelegramSubscriptionSummary: getTelegramSubscriptionSummaryMock,
    getLatestTelegramLinkCodeSummary: getLatestTelegramLinkCodeSummaryMock,
  };
});

import { GET } from "@/app/api/telegram/status/route";

describe("GET /api/telegram/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "12" }));
    getTelegramAccountSummaryMock.mockResolvedValue(null);
    getTelegramSubscriptionSummaryMock.mockResolvedValue(null);
    getLatestTelegramLinkCodeSummaryMock.mockResolvedValue(null);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя", async () => {
    authMock.mockResolvedValue(createSession({ id: "bad-id" }));

    const response = await GET();

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать несвязанный пейлоад когда аккаунт отсутствует", async () => {
    const response = await GET();
    const payload = await expectJsonSuccess<{
      linked: boolean;
      telegram: unknown;
      subscription: unknown;
      codeExpiresAt: string | null;
      codeConsumedAt: string | null;
    }>(response, 200);

    expect(payload.linked).toBe(false);
    expect(payload.telegram).toBeNull();
    expect(payload.subscription).toBeNull();
    expect(payload.codeExpiresAt).toBeNull();
    expect(payload.codeConsumedAt).toBeNull();
    expect(getTelegramAccountSummaryMock).toHaveBeenCalledWith(12);
    expect(getTelegramSubscriptionSummaryMock).toHaveBeenCalledWith(12);
    expect(getLatestTelegramLinkCodeSummaryMock).toHaveBeenCalledWith(12);
  });

  it("должен возвращать связанный пейлоад с telegram и деталями подписки", async () => {
    const linkedAt = new Date("2026-01-02T10:00:00.000Z");
    const expiresAt = new Date("2026-01-03T10:00:00.000Z");
    const consumedAt = new Date("2026-01-03T10:05:00.000Z");
    getTelegramAccountSummaryMock.mockResolvedValue({
      username: "runner",
      firstName: "Ivan",
      linkedAt,
    });
    getTelegramSubscriptionSummaryMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "08:00",
    });
    getLatestTelegramLinkCodeSummaryMock.mockResolvedValue({
      expiresAt,
      consumedAt,
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await readJsonResponse<{
      linked: boolean;
      telegram: { username: string; firstName: string; linkedAt: string } | null;
      subscription: { enabled: boolean; timezone: string; sendTime: string } | null;
      codeExpiresAt: string | null;
      codeConsumedAt: string | null;
    }>(response);

    expect(payload.linked).toBe(true);
    expect(payload.telegram).toEqual({
      username: "runner",
      firstName: "Ivan",
      linkedAt: linkedAt.toISOString(),
    });
    expect(payload.subscription).toEqual({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "08:00",
    });
    expect(payload.codeExpiresAt).toBe(expiresAt.toISOString());
    expect(payload.codeConsumedAt).toBe(consumedAt.toISOString());
  });
});
