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

  it("should return 401 when session is missing", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 401, "Unauthorized");
    expect(generateVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("should return 401 when session has no email", async () => {
    getServerSessionMock.mockResolvedValue(
      createSession({
        email: "",
      })
    );

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 401, "Unauthorized");
    expect(generateVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("should return 400 for already verified email", async () => {
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

  it("should send verification email for unverified user", async () => {
    const response = await POST(createResendVerificationRequest() as any);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(generateVerificationTokenMock).toHaveBeenCalledWith("runner@example.com");
    expect(sendVerificationEmailMock).toHaveBeenCalledWith("runner@example.com", "verify-token");
  });

  it("should return 500 when token generation fails", async () => {
    generateVerificationTokenMock.mockRejectedValue(new Error("token-failed"));

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 500, "Failed to send email");
  });

  it("should return 500 when email sending fails", async () => {
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp-failed"));

    const response = await POST(createResendVerificationRequest() as any);

    await expectJsonError(response, 500, "Failed to send email");
  });
});
