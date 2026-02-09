import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, expectJsonError, expectJsonSuccess } from "@tests/helpers";

const { getUserByEmailMock, generatePasswordResetTokenMock, sendPasswordResetEmailMock } =
  vi.hoisted(() => {
    return {
      getUserByEmailMock: vi.fn(),
      generatePasswordResetTokenMock: vi.fn(),
      sendPasswordResetEmailMock: vi.fn(),
    };
  });

vi.mock("@/server/auth", () => {
  return {
    getUserByEmail: getUserByEmailMock,
  };
});

vi.mock("@/server/tokens", () => {
  return {
    generatePasswordResetToken: generatePasswordResetTokenMock,
  };
});

vi.mock("@/server/email", () => {
  return {
    sendPasswordResetEmail: sendPasswordResetEmailMock,
  };
});

import { POST } from "@/app/api/auth/forgot-password/route";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserByEmailMock.mockResolvedValue({
      id: 1,
      email: "user@example.com",
    });
    generatePasswordResetTokenMock.mockResolvedValue("reset-token");
    sendPasswordResetEmailMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 500 при невалидном пейлоад", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "bad",
      },
    });

    const response = await POST(request as any);
    await expectJsonError(response, 500, "Something went wrong");
  });

  it("должен возвращать успех=true и не отправлять письмо, если пользователь не найден", async () => {
    getUserByEmailMock.mockResolvedValue(null);

    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "missing@example.com",
      },
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(generatePasswordResetTokenMock).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("должен генерировать токен и отправлять письмо для существующего пользователя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "user@example.com",
      },
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(getUserByEmailMock).toHaveBeenCalledWith("user@example.com");
    expect(generatePasswordResetTokenMock).toHaveBeenCalledWith("user@example.com");
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith("user@example.com", "reset-token");
  });

  it("должен возвращать 500 при ошибке генерации токена", async () => {
    generatePasswordResetTokenMock.mockRejectedValue(new Error("token-error"));
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "user@example.com",
      },
    });

    const response = await POST(request as any);
    await expectJsonError(response, 500, "Something went wrong");
  });

  it("должен возвращать 500 при ошибке отправки письма", async () => {
    sendPasswordResetEmailMock.mockRejectedValue(new Error("mail-error"));
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "user@example.com",
      },
    });

    const response = await POST(request as any);
    await expectJsonError(response, 500, "Something went wrong");
  });
});
