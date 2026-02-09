import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, expectJsonError, expectJsonSuccess } from "@tests/helpers";

const { authMock, unlinkTelegramAccountMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    unlinkTelegramAccountMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/telegram", () => {
  return {
    unlinkTelegramAccount: unlinkTelegramAccountMock,
  };
});

import { POST } from "@/app/api/telegram/unlink/route";

describe("POST /api/telegram/unlink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "31" }));
    unlinkTelegramAccountMock.mockResolvedValue({
      accounts: 1,
      subscriptions: 1,
      codes: 2,
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

  it("должен возвращать 500, когда отвязка завершается ошибкой", async () => {
    unlinkTelegramAccountMock.mockRejectedValue(new Error("db-failed"));

    const response = await POST();

    await expectJsonError(response, 500, "unlink-failed");
  });

  it("должен возвращать количества удалений при успехе", async () => {
    const response = await POST();
    const payload = await expectJsonSuccess<{
      ok: boolean;
      accounts: number;
      subscriptions: number;
      codes: number;
    }>(response, 200);

    expect(payload).toEqual({
      ok: true,
      accounts: 1,
      subscriptions: 1,
      codes: 2,
    });
  });
});
