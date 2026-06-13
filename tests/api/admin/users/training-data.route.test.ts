import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, clearUserTrainingDataByIdMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    clearUserTrainingDataByIdMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/adminUsers", () => {
  return {
    clearUserTrainingDataById: clearUserTrainingDataByIdMock,
  };
});

import { DELETE } from "@/app/api/admin/users/[userId]/training-data/route";

function createRouteContext(userId: string) {
  return {
    params: Promise.resolve({ userId }),
  };
}

function createDeleteRequest(userId: string, headers?: HeadersInit) {
  return createJsonRequest({
    url: `http://localhost/api/admin/users/${userId}/training-data`,
    method: "DELETE",
    ...(headers ? { headers } : {}),
  });
}

describe("DELETE /api/admin/users/[userId]/training-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createAdminSession({ id: "100" }));
    clearUserTrainingDataByIdMock.mockResolvedValue({ cleared: true });
  });

  it("должен возвращать 403 при cross-origin запросе", async () => {
    const response = await DELETE(
      createDeleteRequest("12", { Origin: "http://evil.test" }),
      createRouteContext("12")
    );

    await expectJsonError(response, 403, "forbidden");
    expect(clearUserTrainingDataByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await DELETE(createDeleteRequest("12"), createRouteContext("12"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 403 для не-админа", async () => {
    authMock.mockResolvedValue(createSession({ id: "100", role: "athlete" }));

    const response = await DELETE(createDeleteRequest("12"), createRouteContext("12"));

    await expectJsonError(response, 403, "forbidden");
  });

  it("должен возвращать 400 при невалидном id пользователя", async () => {
    const response = await DELETE(createDeleteRequest("bad"), createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_user_id");
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    clearUserTrainingDataByIdMock.mockResolvedValue({ error: "not_found" });

    const response = await DELETE(createDeleteRequest("12"), createRouteContext("12"));

    await expectJsonError(response, 404, "not_found");
  });

  it("должен очищать план и дневник пользователя", async () => {
    const response = await DELETE(createDeleteRequest("12"), createRouteContext("12"));
    const payload = await expectJsonSuccess<{ success: boolean }>(response, 200);

    expect(payload.success).toBe(true);
    expect(clearUserTrainingDataByIdMock).toHaveBeenCalledWith(12);
  });
});
