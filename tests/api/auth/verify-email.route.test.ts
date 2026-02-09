import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, expectRedirectTo } from "@tests/helpers";

const {
  getVerificationTokenByTokenMock,
  getUserByEmailMock,
  markEmailVerifiedByIdMock,
  deleteVerificationTokenByIdMock,
  getServerSessionMock,
} = vi.hoisted(() => {
  return {
    getVerificationTokenByTokenMock: vi.fn(),
    getUserByEmailMock: vi.fn(),
    markEmailVerifiedByIdMock: vi.fn(),
    deleteVerificationTokenByIdMock: vi.fn(),
    getServerSessionMock: vi.fn(),
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
    markEmailVerifiedById: markEmailVerifiedByIdMock,
    deleteVerificationTokenById: deleteVerificationTokenByIdMock,
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

import { GET } from "@/app/api/auth/verify-email/route";

function createVerifyEmailRequest(url: string) {
  return {
    nextUrl: new URL(url),
  };
}

describe("GET /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    getVerificationTokenByTokenMock.mockResolvedValue({
      id: 5,
      identifier: "user@example.com",
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    getUserByEmailMock.mockResolvedValue({
      id: 11,
      email: "user@example.com",
    });
    markEmailVerifiedByIdMock.mockResolvedValue(undefined);
    deleteVerificationTokenByIdMock.mockResolvedValue(undefined);
    getServerSessionMock.mockResolvedValue(null);
  });

  it("должен редиректить с missing_token когда токен запрашивать является отсутствующий", async () => {
    const response = await GET(
      createVerifyEmailRequest("http://localhost/api/auth/verify-email") as any
    );

    expectRedirectTo(response, "/auth/verify-email?error=missing_token");
    expect(getVerificationTokenByTokenMock).not.toHaveBeenCalled();
  });

  it("должен редиректить с invalid_token когда токен является неизвестный", async () => {
    getVerificationTokenByTokenMock.mockResolvedValue(null);

    const response = await GET(
      createVerifyEmailRequest("http://localhost/api/auth/verify-email?token=bad-token") as any
    );

    expectRedirectTo(response, "/auth/verify-email?error=invalid_token");
    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });

  it("должен редиректить с просроченный когда токен является просроченный", async () => {
    getVerificationTokenByTokenMock.mockResolvedValue({
      id: 5,
      identifier: "user@example.com",
      expires: new Date(Date.now() - 60_000).toISOString(),
    });

    const response = await GET(
      createVerifyEmailRequest("http://localhost/api/auth/verify-email?token=expired-token") as any
    );

    expectRedirectTo(response, "/auth/verify-email?error=expired");
    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });

  it("должен редиректить с email_not_found когда пользователь отсутствует", async () => {
    getUserByEmailMock.mockResolvedValue(null);

    const response = await GET(
      createVerifyEmailRequest("http://localhost/api/auth/verify-email?token=valid-token") as any
    );

    expectRedirectTo(response, "/auth/verify-email?error=email_not_found");
    expect(markEmailVerifiedByIdMock).not.toHaveBeenCalled();
    expect(deleteVerificationTokenByIdMock).not.toHaveBeenCalled();
  });

  it("должен подтверждать email и редиректить в dashboard при authenticated сессия", async () => {
    getServerSessionMock.mockResolvedValue(createSession({ id: "11" }));

    const response = await GET(
      createVerifyEmailRequest("http://localhost/api/auth/verify-email?token=valid-token") as any
    );

    expect(markEmailVerifiedByIdMock).toHaveBeenCalledWith(11);
    expect(deleteVerificationTokenByIdMock).toHaveBeenCalledWith(5);
    expectRedirectTo(response, "/dashboard?verified=true");
  });

  it("должен подтверждать email и редиректить в login при анонимной сессия", async () => {
    const response = await GET(
      createVerifyEmailRequest("http://localhost/api/auth/verify-email?token=valid-token") as any
    );

    expect(markEmailVerifiedByIdMock).toHaveBeenCalledWith(11);
    expect(deleteVerificationTokenByIdMock).toHaveBeenCalledWith(5);
    expectRedirectTo(response, "/login?verified=true");
  });
});
