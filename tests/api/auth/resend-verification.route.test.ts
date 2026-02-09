import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { getServerSessionMock, generateVerificationTokenMock, sendVerificationEmailMock } =
  vi.hoisted(() => {
    return {
      getServerSessionMock: vi.fn(),
      generateVerificationTokenMock: vi.fn(),
      sendVerificationEmailMock: vi.fn(),
    };
  });

vi.mock("next-auth", () => {
  return {
    getServerSession: getServerSessionMock,
  };
});

vi.mock("@/auth", () => {
  return {
    authOptions: { providers: [] },
  };
});

vi.mock("@/server/tokens", () => {
  return {
    generateVerificationToken: generateVerificationTokenMock,
  };
});

vi.mock("@/server/email", () => {
  return {
    sendVerificationEmail: sendVerificationEmailMock,
  };
});

import { POST } from "@/app/api/auth/resend-verification/route";

function createResendVerificationRequest() {
  return createJsonRequest({
    url: "http://localhost/api/auth/resend-verification",
    body: {},
  });
}

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(
      createSession({
        email: "runner@example.com",
        emailVerified: null,
      })
    );
    generateVerificationTokenMock.mockResolvedValue("verify-token");
    sendVerificationEmailMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 401, когда сессия отсутствует", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 401, "Unauthorized");
    expect(generateVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401, когда в сессии нет email", async () => {
    getServerSessionMock.mockResolvedValue(
      createSession({
        email: "",
      })
    );

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 401, "Unauthorized");
    expect(generateVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 при уже подтвержденном email", async () => {
    getServerSessionMock.mockResolvedValue(
      createSession({
        email: "runner@example.com",
        emailVerified: new Date(),
      })
    );

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 400, "Email already verified");
    expect(generateVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("должен отправлять письмо подтверждения для неподтвержденного пользователя", async () => {
    const response = await POST(createResendVerificationRequest() as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(generateVerificationTokenMock).toHaveBeenCalledWith("runner@example.com");
    expect(sendVerificationEmailMock).toHaveBeenCalledWith("runner@example.com", "verify-token");
  });

  it("должен возвращать 500, когда генерация токена завершается ошибкой", async () => {
    generateVerificationTokenMock.mockRejectedValue(new Error("token-failed"));

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 500, "Failed to send email");
  });

  it("должен возвращать 500, когда отправка email завершается ошибкой", async () => {
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp-failed"));

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 500, "Failed to send email");
  });
});
