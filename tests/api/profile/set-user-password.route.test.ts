import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const {
  authMock,
  getUserPasswordHashByIdMock,
  updateUserPasswordHashByIdMock,
  bcryptCompareMock,
  bcryptHashMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getUserPasswordHashByIdMock: vi.fn(),
    updateUserPasswordHashByIdMock: vi.fn(),
    bcryptCompareMock: vi.fn(),
    bcryptHashMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/services/users", () => {
  return {
    getUserPasswordHashById: getUserPasswordHashByIdMock,
    updateUserPasswordHashById: updateUserPasswordHashByIdMock,
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      compare: bcryptCompareMock,
      hash: bcryptHashMock,
    },
  };
});

import { PATCH } from "@/app/api/setUserPassword/route";

const validPayload = {
  currentPassword: "old-password",
  newPassword: "new-password",
  confirmPassword: "new-password",
};

describe("PATCH /api/setUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    getUserPasswordHashByIdMock.mockResolvedValue({
      id: 13,
      passwordHash: "old-hash",
    });
    updateUserPasswordHashByIdMock.mockResolvedValue({ id: 13 });
    bcryptCompareMock.mockResolvedValue(true);
    bcryptHashMock.mockResolvedValue("new-hash");
  });

  it("должен возвращать 403 при cross-origin запросе", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      headers: { Origin: "http://evil.test" },
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 403, "forbidden");
    expect(getUserPasswordHashByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя в сессии", async () => {
    authMock.mockResolvedValue(createSession({ id: "bad-id" }));
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном payload", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: {
        ...validPayload,
        confirmPassword: "another-password",
      },
    });

    const response = await PATCH(request);

    await expectJsonError(response, 400, "invalid_payload");
    expect(getUserPasswordHashByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 при лишнем userId в body", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: {
        ...validPayload,
        userId: 999,
      },
    });

    const response = await PATCH(request);

    await expectJsonError(response, 400, "invalid_payload");
    expect(getUserPasswordHashByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    getUserPasswordHashByIdMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 404, "not_found");
  });

  it("должен возвращать 403 при неверном текущем пароле", async () => {
    bcryptCompareMock.mockResolvedValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 403, "invalid_current_password");
    expect(updateUserPasswordHashByIdMock).not.toHaveBeenCalled();
  });

  it("должен хешировать и сохранять новый пароль для пользователя из сессии", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setUserPassword",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(getUserPasswordHashByIdMock).toHaveBeenCalledWith(13);
    expect(bcryptCompareMock).toHaveBeenCalledWith("old-password", "old-hash");
    expect(bcryptHashMock).toHaveBeenCalledWith("new-password", 10);
    expect(updateUserPasswordHashByIdMock).toHaveBeenCalledWith(13, "new-hash");
  });
});
