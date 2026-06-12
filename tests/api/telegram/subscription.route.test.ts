import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateTelegramSubscriptionSettingsMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateTelegramSubscriptionSettingsMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/telegram", () => {
  return {
    updateTelegramSubscriptionSettings: updateTelegramSubscriptionSettingsMock,
  };
});

import { PATCH } from "@/app/api/telegram/subscription/route";

const validPayload = {
  enabled: true,
  sendTime: "07:30",
};

function createRequest(body: unknown, headers?: HeadersInit) {
  const options = {
    url: "http://localhost/api/telegram/subscription",
    method: "PATCH",
    body,
  };

  if (!headers) {
    return createJsonRequest(options);
  }

  return createJsonRequest({
    ...options,
    headers,
  });
}

describe("PATCH /api/telegram/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    updateTelegramSubscriptionSettingsMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "07:30",
    });
  });

  it("должен возвращать 403 при cross-origin запросе", async () => {
    const response = await PATCH(createRequest(validPayload, { Origin: "http://evil.test" }));

    await expectJsonError(response, 403, "forbidden");
    expect(updateTelegramSubscriptionSettingsMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await PATCH(createRequest(validPayload));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя", async () => {
    authMock.mockResolvedValue(createSession({ id: "bad-id" }));

    const response = await PATCH(createRequest(validPayload));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном payload", async () => {
    const response = await PATCH(
      createRequest({
        enabled: true,
        sendTime: null,
      })
    );

    await expectJsonError(response, 400, "invalid_payload");
    expect(updateTelegramSubscriptionSettingsMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 404 если Telegram не связан", async () => {
    updateTelegramSubscriptionSettingsMock.mockResolvedValue(null);

    const response = await PATCH(createRequest(validPayload));

    await expectJsonError(response, 404, "telegram_not_linked");
  });

  it("должен обновлять настройки подписки", async () => {
    const response = await PATCH(createRequest(validPayload));
    const payload = await expectJsonSuccess<{
      success: boolean;
      subscription: {
        enabled: boolean;
        timezone: string;
        sendTime: string;
      };
    }>(response, 200);

    expect(payload).toEqual({
      success: true,
      subscription: {
        enabled: true,
        timezone: "Europe/Moscow",
        sendTime: "07:30",
      },
    });
    expect(updateTelegramSubscriptionSettingsMock).toHaveBeenCalledWith(13, validPayload);
  });

  it("должен возвращать 500 при ошибке обновления", async () => {
    updateTelegramSubscriptionSettingsMock.mockRejectedValue(new Error("db-failed"));

    const response = await PATCH(createRequest(validPayload));

    await expectJsonError(response, 500, "update_failed");
  });
});
