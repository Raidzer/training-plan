import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const { authMock, issueTelegramLinkCodeMock, getTelegramAccountIdByUserIdMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    issueTelegramLinkCodeMock: vi.fn(),
    getTelegramAccountIdByUserIdMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/telegramLink", () => {
  return {
    issueTelegramLinkCode: issueTelegramLinkCodeMock,
  };
});

vi.mock("@/server/telegram", () => {
  return {
    getTelegramAccountIdByUserId: getTelegramAccountIdByUserIdMock,
  };
});

import { POST } from "@/app/api/telegram/link-code/route";

describe("POST /api/telegram/link-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "25" }));
    getTelegramAccountIdByUserIdMock.mockResolvedValue(null);
    issueTelegramLinkCodeMock.mockResolvedValue({
      code: "123456",
      expiresAt: new Date("2026-02-09T11:00:00.000Z"),
    });
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST();

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя", async () => {
    authMock.mockResolvedValue(createSession({ id: "bad-id" }));

    const response = await POST();

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 409 когда аккаунт уже связан", async () => {
    getTelegramAccountIdByUserIdMock.mockResolvedValue(99);

    const response = await POST();

    await expectJsonError(response, 409, "already-linked");
    expect(issueTelegramLinkCodeMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 500 когда выдача завершается ошибкой", async () => {
    issueTelegramLinkCodeMock.mockRejectedValue(new Error("boom"));

    const response = await POST();

    await expectJsonError(response, 500, "issue-failed");
  });

  it("должен выдавать код при валидном запрос", async () => {
    const expiresAt = new Date("2026-02-09T11:00:00.000Z");
    issueTelegramLinkCodeMock.mockResolvedValue({ code: "654321", expiresAt });

    const response = await POST();
    expect(response.status).toBe(200);
    const payload = await readJsonResponse<{ code: string; expiresAt: string }>(response);

    expect(payload).toEqual({
      code: "654321",
      expiresAt: expiresAt.toISOString(),
    });
    expect(getTelegramAccountIdByUserIdMock).toHaveBeenCalledWith(25);
    expect(issueTelegramLinkCodeMock).toHaveBeenCalledWith({ userId: 25 });
  });
});
