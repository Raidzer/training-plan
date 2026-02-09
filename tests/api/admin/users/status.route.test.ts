import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateUserStatusByIdMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateUserStatusByIdMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/adminUsers", () => {
  return {
    updateUserStatusById: updateUserStatusByIdMock,
  };
});

import { PATCH } from "@/app/api/admin/users/[userId]/status/route";

function createRouteContext(userId: string) {
  return {
    params: Promise.resolve({ userId }),
  };
}

describe("PATCH /api/admin/users/[userId]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createAdminSession({ id: "100" }));
    updateUserStatusByIdMock.mockResolvedValue({
      id: 12,
      isActive: true,
    });
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/status",
      method: "PATCH",
      body: { isActive: true },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 403 для не-админа", async () => {
    authMock.mockResolvedValue(createSession({ id: "100", role: "athlete" }));
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/status",
      method: "PATCH",
      body: { isActive: true },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 403, "forbidden");
  });

  it("должен возвращать 401 при невалидном id пользователя в сессии", async () => {
    authMock.mockResolvedValue(createAdminSession({ id: "bad-id" }));
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/status",
      method: "PATCH",
      body: { isActive: true },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном id пользователя в параметрах", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/bad/status",
      method: "PATCH",
      body: { isActive: true },
    });

    const response = await PATCH(request, createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_user_id");
  });

  it("должен возвращать 400 при невалидном пейлоад", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/status",
      method: "PATCH",
      body: { isActive: "yes" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 400, "invalid_payload");
  });

  it("должен возвращать 400 когда админ пытается в отключить себя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/100/status",
      method: "PATCH",
      body: { isActive: false },
    });

    const response = await PATCH(request, createRouteContext("100"));

    await expectJsonError(response, 400, "cannot_disable_self");
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    updateUserStatusByIdMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/status",
      method: "PATCH",
      body: { isActive: false },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 404, "not_found");
  });

  it("должен обновлять пользователь статус при валидном пейлоад", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/status",
      method: "PATCH",
      body: { isActive: false },
    });

    const response = await PATCH(request, createRouteContext("12"));
    const payload = await expectJsonSuccess<{ user: { id: number; isActive: boolean } }>(
      response,
      200
    );

    expect(payload.user).toEqual({ id: 12, isActive: true });
    expect(updateUserStatusByIdMock).toHaveBeenCalledWith(12, false);
  });
});
