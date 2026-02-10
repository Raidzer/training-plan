import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, expectJsonError, expectJsonSuccess } from "@tests/helpers";

const {
  getVerificationTokenByTokenMock,
  getUserByEmailMock,
  updateUserPasswordByIdMock,
  deleteVerificationTokenByIdMock,
  hashMock,
} = vi.hoisted(() => {
  return {
    getVerificationTokenByTokenMock: vi.fn(),
    getUserByEmailMock: vi.fn(),
    updateUserPasswordByIdMock: vi.fn(),
    deleteVerificationTokenByIdMock: vi.fn(),
    hashMock: vi.fn(),
  };
});

vi.mock("@/server/tokens", () => {
  return {
    getVerificationTokenByToken: getVerificationTokenByTokenMock,
  };
});

vi.mock("@/server/auth", () => {
  return {
    getUserByEmail: getUserByEmailMock,
    updateUserPasswordById: updateUserPasswordByIdMock,
    deleteVerificationTokenById: deleteVerificationTokenByIdMock,
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
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    getUserByEmailMock.mockResolvedValue({
      id: 42,
      email: "user@example.com",
    });
    hashMock.mockResolvedValue("hashed-password");
    updateUserPasswordByIdMock.mockResolvedValue(undefined);
    deleteVerificationTokenByIdMock.mockResolvedValue(undefined);
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

  it("должен возвращать 400, когда токен просрочен", async () => {
    getVerificationTokenByTokenMock.mockResolvedValue({
      id: 7,
      identifier: "user@example.com",
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
    expect(updateUserPasswordByIdMock).not.toHaveBeenCalled();
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
    expect(updateUserPasswordByIdMock).toHaveBeenCalledWith(42, "hashed-password");
    expect(deleteVerificationTokenByIdMock).toHaveBeenCalledWith(7);
  });

  it("должен возвращать 500, когда обновление пароля завершается ошибкой", async () => {
    updateUserPasswordByIdMock.mockRejectedValue(new Error("db-failed"));

    const response = await POST(
      createResetPasswordRequest({
        token: "valid-token",
        password: "new-password-123",
      }) as any
    );

    await expectJsonError(response, 500, "Something went wrong");
  });
});
