import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const {
  authMock,
  buildTelegramBotUrlMock,
  getTelegramAccountSummaryMock,
  getTelegramSubscriptionSummaryMock,
  getLatestTelegramLinkCodeSummaryMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    buildTelegramBotUrlMock: vi.fn(),
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

vi.mock("@/server/telegramLink", () => {
  return {
    buildTelegramBotUrl: buildTelegramBotUrlMock,
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
    process.env.TELEGRAM_BOT_USERNAME = "RunLogBot";
    buildTelegramBotUrlMock.mockReturnValue("https://t.me/RunLogBot");
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
      botUrl: string | null;
      telegram: unknown;
      subscription: unknown;
      codeExpiresAt: string | null;
      codeConsumedAt: string | null;
    }>(response, 200);

    expect(payload.linked).toBe(false);
    expect(payload.botUrl).toBe("https://t.me/RunLogBot");
    expect(payload.telegram).toBeNull();
    expect(payload.subscription).toBeNull();
    expect(payload.codeExpiresAt).toBeNull();
    expect(payload.codeConsumedAt).toBeNull();
    expect(getTelegramAccountSummaryMock).toHaveBeenCalledWith(12);
    expect(getTelegramSubscriptionSummaryMock).toHaveBeenCalledWith(12);
    expect(getLatestTelegramLinkCodeSummaryMock).toHaveBeenCalledWith(12);
    expect(buildTelegramBotUrlMock).toHaveBeenCalledWith("RunLogBot");
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
      botUrl: string | null;
      telegram: { username: string; firstName: string; linkedAt: string } | null;
      subscription: { enabled: boolean; timezone: string; sendTime: string } | null;
      codeExpiresAt: string | null;
      codeConsumedAt: string | null;
    }>(response);

    expect(payload.linked).toBe(true);
    expect(payload.botUrl).toBe("https://t.me/RunLogBot");
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
