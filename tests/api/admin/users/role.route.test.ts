import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateUserRoleByIdMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateUserRoleByIdMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/adminUsers", () => {
  return {
    updateUserRoleById: updateUserRoleByIdMock,
  };
});

import { PATCH } from "@/app/api/admin/users/[userId]/role/route";

function createRouteContext(userId: string) {
  return {
    params: Promise.resolve({ userId }),
  };
}

describe("PATCH /api/admin/users/[userId]/role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createAdminSession({ id: "100" }));
    updateUserRoleByIdMock.mockResolvedValue({ id: 12, role: "coach" });
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/role",
      method: "PATCH",
      body: { role: "coach" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 403 при не-админ", async () => {
    authMock.mockResolvedValue(createSession({ id: "100", role: "athlete" }));
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/role",
      method: "PATCH",
      body: { role: "coach" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 403, "forbidden");
  });

  it("должен возвращать 400 при невалидном id пользователя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/bad/role",
      method: "PATCH",
      body: { role: "coach" },
    });

    const response = await PATCH(request, createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_user_id");
  });

  it("должен возвращать 400 при невалидном пейлоад", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/role",
      method: "PATCH",
      body: { role: "owner" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 400, "invalid_payload");
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    updateUserRoleByIdMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/role",
      method: "PATCH",
      body: { role: "coach" },
    });

    const response = await PATCH(request, createRouteContext("12"));

    await expectJsonError(response, 404, "not_found");
  });

  it("должен обновлять роль при валидном пейлоад", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/admin/users/12/role",
      method: "PATCH",
      body: { role: "coach" },
    });

    const response = await PATCH(request, createRouteContext("12"));
    const payload = await expectJsonSuccess<{ user: { id: number; role: string } }>(response, 200);

    expect(payload.user).toEqual({ id: 12, role: "coach" });
    expect(updateUserRoleByIdMock).toHaveBeenCalledWith(12, "coach");
  });
});
