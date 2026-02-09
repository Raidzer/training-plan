import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateUserPasswordHashByIdMock, bcryptHashMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateUserPasswordHashByIdMock: vi.fn(),
    bcryptHashMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/adminUsers", () => {
  return {
    updateUserPasswordHashById: updateUserPasswordHashByIdMock,
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      hash: bcryptHashMock,
    },
  };
});

import { PATCH } from "@/app/api/admin/users/[userId]/password/route";

function createRouteContext(userId: string) {
  return {
    params: Promise.resolve({ userId }),
  };
}

describe("PATCH /api/admin/users/[userId]/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createAdminSession({ id: "100" }));
    bcryptHashMock.mockResolvedValue("hashed-password");
    updateUserPasswordHashByIdMock.mockResolvedValue(true);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/password",
      method: "PATCH",
      body: { password: "secret123" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 403 при не-админе", async () => {
    authMock.mockResolvedValue(createSession({ id: "100", role: "athlete" }));
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/password",
      method: "PATCH",
      body: { password: "secret123" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 403, "forbidden");
  });

  it("должен возвращать 400 при невалидном id пользователя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/bad/password",
      method: "PATCH",
      body: { password: "secret123" },
    });

    const response = await PATCH(request, createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_user_id");
  });

  it("должен возвращать 400 при невалидном пейлоад", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/password",
      method: "PATCH",
      body: { password: "123" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 400, "invalid_payload");
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    updateUserPasswordHashByIdMock.mockResolvedValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/password",
      method: "PATCH",
      body: { password: "secret123" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 404, "not_found");
  });

  it("должен хешировать пароль и обновлять пользователя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/password",
      method: "PATCH",
      body: { password: "secret123" },
    });

    const response = await PATCH(request, createRouteContext("12"));
    const payload = await expectJsonSuccess<{ ok: boolean }>(response, 200);

    expect(payload.ok).toBe(true);
    expect(bcryptHashMock).toHaveBeenCalledWith("secret123", 10);
    expect(updateUserPasswordHashByIdMock).toHaveBeenCalledWith(12, "hashed-password");
  });
});
