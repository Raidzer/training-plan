import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, expectJsonError, expectJsonSuccess } from "@tests/helpers";

const { getVerificationTokenByTokenMock, getUserByEmailMock, resetUserPasswordMock, hashMock } =
  vi.hoisted(() => ({
    getVerificationTokenByTokenMock: vi.fn(),
    getUserByEmailMock: vi.fn(),
    resetUserPasswordMock: vi.fn(),
    hashMock: vi.fn(),
  }));

vi.mock("@/server/tokens", () => {
  return {
    getVerificationTokenByToken: getVerificationTokenByTokenMock,
  };
});

vi.mock("@/server/auth", () => {
  return {
    getUserByEmail: getUserByEmailMock,
    resetUserPassword: resetUserPasswordMock,
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      hash: hashMock,
    },
  };
});

import { POST } from "@/app/api/auth/reset-password/route";

function createResetPasswordRequest(body: Record<string, unknown>) {
  return createJsonRequest({
    url: "http://localhost/api/auth/reset-password",
    body,
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVerificationTokenByTokenMock.mockResolvedValue({
      id: 7,
      identifier: "user@example.com",
      type: "reset-password",
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    getUserByEmailMock.mockResolvedValue({
      id: 42,
      email: "user@example.com",
    });
    hashMock.mockResolvedValue("hashed-password");
    resetUserPasswordMock.mockResolvedValue(true);
  });

  it("должен возвращать 500 при невалидном payload", async () => {
    const response = await POST(
      createResetPasswordRequest({
        token: "token-1",
        password: "123",
      }) as any
    );

    await expectJsonError(response, 500, "Something went wrong");
    expect(getVerificationTokenByTokenMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400, когда токен отсутствует", async () => {
    getVerificationTokenByTokenMock.mockResolvedValue(null);

    const response = await POST(
      createResetPasswordRequest({
        token: "missing-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 400, "Invalid token");
    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400, когда токен не для сброса пароля", async () => {
    getVerificationTokenByTokenMock.mockResolvedValue({
      id: 7,
      identifier: "test@example.com",
      type: "verify-email",
      expires: new Date(Date.now() + 60_000).toISOString(),
    });

    const response = await POST(
      createResetPasswordRequest({
        token: "wrong-type-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 400, "Invalid token");
    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400, когда токен просрочен", async () => {
    getVerificationTokenByTokenMock.mockResolvedValue({
      id: 7,
      identifier: "user@example.com",
      type: "reset-password",
      expires: new Date(Date.now() - 60_000).toISOString(),
    });

    const response = await POST(
      createResetPasswordRequest({
        token: "expired-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 400, "Token has expired");
    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400, когда пользователь не найден", async () => {
    getUserByEmailMock.mockResolvedValue(null);

    const response = await POST(
      createResetPasswordRequest({
        token: "valid-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 400, "User not found");
    expect(resetUserPasswordMock).not.toHaveBeenCalled();
  });

  it("должен обновлять пароль и удалять токен при валидном запросе", async () => {
    const response = await POST(
      createResetPasswordRequest({
        token: "valid-token",
        password: "new-password-123",
      }) as any
    );

    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);
    expect(payload.success).toBe(true);
    expect(hashMock).toHaveBeenCalledWith("new-password-123", 10);
    expect(resetUserPasswordMock).toHaveBeenCalledWith(
      42,
      "user@example.com",
      7,
      "hashed-password"
    );
  });

  it("отклоняет запрос, если токен больше недоступен на момент записи", async () => {
    resetUserPasswordMock.mockResolvedValue(false);
    const response = await POST(
      createResetPasswordRequest({
        token: "replaced-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 400, "Invalid token");
  });

  it("должен возвращать 500, когда обновление пароля завершается ошибкой", async () => {
    resetUserPasswordMock.mockRejectedValue(new Error("db-failed"));

    const response = await POST(
      createResetPasswordRequest({
        token: "valid-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 500, "Something went wrong");
  });
});
