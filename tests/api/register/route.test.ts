import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

type RegisterErrorCode =
  | "invite_invalid"
  | "invite_used"
  | "invite_expired"
  | "user_exists"
  | "create_failed";

const {
  registerUserWithInviteMock,
  generateVerificationTokenMock,
  sendVerificationEmailMock,
  RegisterErrorMock,
} = vi.hoisted(() => {
  class RegisterErrorMockClass extends Error {
    code: RegisterErrorCode;

    constructor(code: RegisterErrorCode) {
      super(code);
      this.code = code;
    }
  }

  return {
    registerUserWithInviteMock: vi.fn(),
    generateVerificationTokenMock: vi.fn(),
    sendVerificationEmailMock: vi.fn(),
    RegisterErrorMock: RegisterErrorMockClass,
  };
});

vi.mock("@/server/register", () => {
  return {
    RegisterError: RegisterErrorMock,
    registerUserWithInvite: registerUserWithInviteMock,
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

import { POST } from "@/app/api/register/route";

function createValidRegisterBody(overrides: Record<string, unknown> = {}) {
  return {
    login: "runner01",
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    email: "runner@example.com",
    password: "password123",
    inviteToken: "invite-token-12345",
    ...overrides,
  };
}

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerUserWithInviteMock.mockResolvedValue({
      user: {
        id: 1,
        email: "runner@example.com",
        name: "Иван",
      },
    });
    generateVerificationTokenMock.mockResolvedValue("verify-token");
    sendVerificationEmailMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 400 для невалидного payload", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: {
        login: "ab",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const payload = await readJsonResponse<{ error?: string }>(response);
    expect(payload.error).toBeTruthy();
  });

  it("должен регистрировать пользователя и отправлять verification email", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody({
        lastName: "  Петров  ",
      }),
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ user: { id: number; email: string } }>(response, 201);

    expect(payload.user.email).toBe("runner@example.com");
    expect(registerUserWithInviteMock).toHaveBeenCalledWith({
      login: "runner01",
      name: "Иван",
      lastName: "Петров",
      gender: "male",
      email: "runner@example.com",
      password: "password123",
      inviteToken: "invite-token-12345",
      timezone: null,
    });
    expect(generateVerificationTokenMock).toHaveBeenCalledWith("runner@example.com");
    expect(sendVerificationEmailMock).toHaveBeenCalledWith("runner@example.com", "verify-token");
  });

  it("должен сохранять успех регистрации даже при ошибке отправки email", async () => {
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp-failed"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ user: { id: number } }>(response, 201);

    expect(payload.user.id).toBe(1);
    expect(registerUserWithInviteMock).toHaveBeenCalledTimes(1);
  });

  it("должен маппить RegisterError invite_invalid", async () => {
    registerUserWithInviteMock.mockRejectedValue(new RegisterErrorMock("invite_invalid"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });
    const response = await POST(request);
    await expectJsonError(response, 404, "invite_invalid");
  });

  it("должен маппить RegisterError invite_used", async () => {
    registerUserWithInviteMock.mockRejectedValue(new RegisterErrorMock("invite_used"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });
    const response = await POST(request);
    await expectJsonError(response, 409, "invite_used");
  });

  it("должен маппить RegisterError invite_expired", async () => {
    registerUserWithInviteMock.mockRejectedValue(new RegisterErrorMock("invite_expired"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });
    const response = await POST(request);
    await expectJsonError(response, 410, "invite_expired");
  });

  it("должен маппить RegisterError user_exists", async () => {
    registerUserWithInviteMock.mockRejectedValue(new RegisterErrorMock("user_exists"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });
    const response = await POST(request);
    await expectJsonError(response, 409, "Email or login already in use");
  });

  it("должен маппить RegisterError create_failed", async () => {
    registerUserWithInviteMock.mockRejectedValue(new RegisterErrorMock("create_failed"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });
    const response = await POST(request);
    await expectJsonError(response, 500, "Failed to create user");
  });

  it("должен возвращать 500 при неизвестной ошибке", async () => {
    registerUserWithInviteMock.mockRejectedValue(new Error("unexpected"));
    const request = createJsonRequest({
      url: "http://localhost/api/register",
      body: createValidRegisterBody(),
    });
    const response = await POST(request);
    await expectJsonError(response, 500, "Failed to create user");
  });
});
