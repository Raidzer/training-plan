import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const {
  authMock,
  bcryptCompareMock,
  getUserByIdentifierMock,
  getUserEmailCredentialsByIdMock,
  updateUserEmailByIdMock,
  deleteVerificationTokensByIdentifierAndTypeMock,
  generateVerificationTokenMock,
  sendVerificationEmailMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    bcryptCompareMock: vi.fn(),
    getUserByIdentifierMock: vi.fn(),
    getUserEmailCredentialsByIdMock: vi.fn(),
    updateUserEmailByIdMock: vi.fn(),
    deleteVerificationTokensByIdentifierAndTypeMock: vi.fn(),
    generateVerificationTokenMock: vi.fn(),
    sendVerificationEmailMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      compare: bcryptCompareMock,
    },
  };
});

vi.mock("@/server/services/users", () => {
  return {
    getUserByIdentifier: getUserByIdentifierMock,
    getUserEmailCredentialsById: getUserEmailCredentialsByIdMock,
    updateUserEmailById: updateUserEmailByIdMock,
  };
});

vi.mock("@/server/tokens", () => {
  return {
    deleteVerificationTokensByIdentifierAndType: deleteVerificationTokensByIdentifierAndTypeMock,
    generateVerificationToken: generateVerificationTokenMock,
  };
});

vi.mock("@/server/email", () => {
  return {
    sendVerificationEmail: sendVerificationEmailMock,
  };
});

import { PATCH } from "@/app/api/profile/email/route";

const validPayload = {
  email: "New.Email@Example.COM",
  currentPassword: "current-password",
};

function createChangeEmailRequest(body: Record<string, unknown>, headers?: HeadersInit) {
  return createJsonRequest({
    url: "http://localhost/api/profile/email",
    method: "PATCH",
    body,
    ...(headers ? { headers } : {}),
  });
}

describe("PATCH /api/profile/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    getUserEmailCredentialsByIdMock.mockResolvedValue({
      id: 13,
      email: "old@example.com",
      passwordHash: "old-hash",
    });
    bcryptCompareMock.mockResolvedValue(true);
    getUserByIdentifierMock.mockResolvedValue(null);
    updateUserEmailByIdMock.mockResolvedValue({
      id: 13,
      email: "new.email@example.com",
      login: "runner13",
      name: "Runner",
      lastName: null,
      gender: "male",
      timezone: "Europe/Moscow",
    });
    deleteVerificationTokensByIdentifierAndTypeMock.mockResolvedValue(undefined);
    generateVerificationTokenMock.mockResolvedValue("verify-token");
    sendVerificationEmailMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 403 при cross-origin запросе", async () => {
    const response = await PATCH(
      createChangeEmailRequest(validPayload, { Origin: "http://evil.test" })
    );

    await expectJsonError(response, 403, "forbidden");
    expect(getUserEmailCredentialsByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await PATCH(createChangeEmailRequest(validPayload));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном payload", async () => {
    const response = await PATCH(
      createChangeEmailRequest({
        ...validPayload,
        userId: 99,
      })
    );

    await expectJsonError(response, 400, "invalid_payload");
    expect(getUserEmailCredentialsByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    getUserEmailCredentialsByIdMock.mockResolvedValue(null);

    const response = await PATCH(createChangeEmailRequest(validPayload));

    await expectJsonError(response, 404, "not_found");
  });

  it("должен возвращать 403 при неверном текущем пароле", async () => {
    bcryptCompareMock.mockResolvedValue(false);

    const response = await PATCH(createChangeEmailRequest(validPayload));

    await expectJsonError(response, 403, "invalid_current_password");
    expect(getUserByIdentifierMock).not.toHaveBeenCalled();
    expect(updateUserEmailByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 когда email не изменился", async () => {
    const response = await PATCH(
      createChangeEmailRequest({
        email: " OLD@example.COM ",
        currentPassword: "current-password",
      })
    );

    await expectJsonError(response, 400, "email_unchanged");
    expect(updateUserEmailByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 409 когда новый email или login уже используется", async () => {
    getUserByIdentifierMock.mockResolvedValue({
      id: 22,
      email: "new.email@example.com",
      login: "other",
    });

    const response = await PATCH(createChangeEmailRequest(validPayload));

    await expectJsonError(response, 409, "email_conflict");
    expect(updateUserEmailByIdMock).not.toHaveBeenCalled();
  });

  it("должен обновлять email, сбрасывать подтверждение и отправлять письмо", async () => {
    const response = await PATCH(createChangeEmailRequest(validPayload));
    const payload = await expectJsonSuccess<{
      success: boolean;
      emailSent: boolean;
      user: { id: number; email: string; login: string };
    }>(response, 200);

    expect(payload).toMatchObject({
      success: true,
      emailSent: true,
      user: {
        id: 13,
        email: "new.email@example.com",
        login: "runner13",
      },
    });
    expect(bcryptCompareMock).toHaveBeenCalledWith("current-password", "old-hash");
    expect(getUserByIdentifierMock).toHaveBeenCalledWith("new.email@example.com");
    expect(updateUserEmailByIdMock).toHaveBeenCalledWith(13, "new.email@example.com");
    expect(deleteVerificationTokensByIdentifierAndTypeMock).toHaveBeenCalledWith(
      "old@example.com",
      "verify-email"
    );
    expect(deleteVerificationTokensByIdentifierAndTypeMock).toHaveBeenCalledWith(
      "new.email@example.com",
      "verify-email"
    );
    expect(generateVerificationTokenMock).toHaveBeenCalledWith("new.email@example.com");
    expect(sendVerificationEmailMock).toHaveBeenCalledWith("new.email@example.com", "verify-token");
  });

  it("должен возвращать успех с emailSent=false если письмо не отправилось", async () => {
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp-failed"));

    const response = await PATCH(createChangeEmailRequest(validPayload));
    const payload = await expectJsonSuccess<{ success: boolean; emailSent: boolean }>(
      response,
      200
    );

    expect(payload.success).toBe(true);
    expect(payload.emailSent).toBe(false);
    expect(updateUserEmailByIdMock).toHaveBeenCalledWith(13, "new.email@example.com");
  });

  it("должен возвращать 409 при unique violation во время обновления", async () => {
    updateUserEmailByIdMock.mockRejectedValue({ code: "23505" });

    const response = await PATCH(createChangeEmailRequest(validPayload));

    await expectJsonError(response, 409, "email_conflict");
  });
});
