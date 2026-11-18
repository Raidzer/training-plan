import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, expectJsonError, expectJsonSuccess } from "@tests/helpers";

const { generatePasswordResetTokenMock, sendPasswordResetEmailMock } = vi.hoisted(() => ({
  generatePasswordResetTokenMock: vi.fn(),
  sendPasswordResetEmailMock: vi.fn(),
}));

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

  it("должен возвращать успех=true и не отправлять письмо, если токен не выдан", async () => {
    generatePasswordResetTokenMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "missing@example.com",
      },
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
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
    expect(generatePasswordResetTokenMock).toHaveBeenCalledWith("user@example.com");
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith("user@example.com", "reset-token");
  });

  it("должен возвращать одинаковый успех без повторной отправки в cooldown", async () => {
    generatePasswordResetTokenMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "user@example.com",
      },
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
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

  it("должен возвращать тот же ответ при ошибке отправки письма", async () => {
    sendPasswordResetEmailMock.mockRejectedValue(new Error("mail-error"));
    const request = createJsonRequest({
      url: "http://localhost/api/auth/forgot-password",
      body: {
        email: "user@example.com",
      },
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload).toEqual({ success: true });
  });
});
