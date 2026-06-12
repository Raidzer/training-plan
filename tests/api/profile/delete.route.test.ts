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
  canDeleteUserRoleMock,
  deleteUserAccountByIdMock,
  getUserDeletionCredentialsByIdMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    bcryptCompareMock: vi.fn(),
    canDeleteUserRoleMock: vi.fn(),
    deleteUserAccountByIdMock: vi.fn(),
    getUserDeletionCredentialsByIdMock: vi.fn(),
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

vi.mock("@/server/adminUsers", () => {
  return {
    canDeleteUserRole: canDeleteUserRoleMock,
    deleteUserAccountById: deleteUserAccountByIdMock,
  };
});

vi.mock("@/server/services/users", () => {
  return {
    getUserDeletionCredentialsById: getUserDeletionCredentialsByIdMock,
  };
});

import { DELETE } from "@/app/api/profile/route";

const validPayload = {
  currentPassword: "current-password",
};

function createDeleteProfileRequest(body: Record<string, unknown>, headers?: HeadersInit) {
  return createJsonRequest({
    url: "http://localhost/api/profile",
    method: "DELETE",
    body,
    ...(headers ? { headers } : {}),
  });
}

describe("DELETE /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13", role: "athlete" }));
    getUserDeletionCredentialsByIdMock.mockResolvedValue({
      id: 13,
      email: "runner@example.com",
      role: "athlete",
      passwordHash: "old-hash",
    });
    canDeleteUserRoleMock.mockReturnValue(true);
    bcryptCompareMock.mockResolvedValue(true);
    deleteUserAccountByIdMock.mockResolvedValue({ deleted: true });
  });

  it("должен возвращать 403 при cross-origin запросе", async () => {
    const response = await DELETE(
      createDeleteProfileRequest(validPayload, { Origin: "http://evil.test" })
    );

    await expectJsonError(response, 403, "forbidden");
    expect(getUserDeletionCredentialsByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await DELETE(createDeleteProfileRequest(validPayload));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном payload", async () => {
    const response = await DELETE(
      createDeleteProfileRequest({
        currentPassword: "",
      })
    );

    await expectJsonError(response, 400, "invalid_payload");
    expect(getUserDeletionCredentialsByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    getUserDeletionCredentialsByIdMock.mockResolvedValue(null);

    const response = await DELETE(createDeleteProfileRequest(validPayload));

    await expectJsonError(response, 404, "not_found");
  });

  it("должен возвращать 403 для администратора", async () => {
    getUserDeletionCredentialsByIdMock.mockResolvedValue({
      id: 13,
      email: "admin@example.com",
      role: "admin",
      passwordHash: "old-hash",
    });
    canDeleteUserRoleMock.mockReturnValue(false);

    const response = await DELETE(createDeleteProfileRequest(validPayload));

    await expectJsonError(response, 403, "forbidden");
    expect(bcryptCompareMock).not.toHaveBeenCalled();
    expect(deleteUserAccountByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 403 при неверном текущем пароле", async () => {
    bcryptCompareMock.mockResolvedValue(false);

    const response = await DELETE(createDeleteProfileRequest(validPayload));

    await expectJsonError(response, 403, "invalid_current_password");
    expect(deleteUserAccountByIdMock).not.toHaveBeenCalled();
  });

  it("должен удалять текущий профиль", async () => {
    const response = await DELETE(createDeleteProfileRequest(validPayload));
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(bcryptCompareMock).toHaveBeenCalledWith("current-password", "old-hash");
    expect(deleteUserAccountByIdMock).toHaveBeenCalledWith(13);
  });
});
