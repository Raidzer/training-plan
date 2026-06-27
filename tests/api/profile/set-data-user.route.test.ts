import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateUserProfileByIdMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateUserProfileByIdMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/services/users", () => {
  return {
    updateUserProfileById: updateUserProfileByIdMock,
  };
});

import { PATCH } from "@/app/api/setDataUser/route";

const validPayload = {
  name: "  Ivan  ",
  lastName: "  Petrov  ",
  patronymic: "  Ivanovich  ",
  heightCm: 180,
  weeklyWorkloadCount: 5,
  gender: "male",
  dateOfBirth: "1990-04-12",
  occupation: "work",
  miscellaneous: "  Starts on Tuesday  ",
  timezone: "Europe/Moscow",
};

describe("PATCH /api/setDataUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    updateUserProfileByIdMock.mockResolvedValue({
      id: 13,
      email: "runner@example.test",
      name: "Ivan",
      lastName: "Petrov",
      patronymic: "Ivanovich",
      heightCm: 180,
      weeklyWorkloadCount: 5,
      gender: "male",
      dateOfBirth: "1990-04-12",
      occupation: "work",
      miscellaneous: "Starts on Tuesday",
      timezone: "Europe/Moscow",
    });
  });

  it("должен возвращать 403 при cross-origin запросе", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      headers: { Origin: "http://evil.test" },
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 403, "forbidden");
    expect(updateUserProfileByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя в сессии", async () => {
    authMock.mockResolvedValue(createSession({ id: "bad-id" }));
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при лишнем userId в body", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: {
        ...validPayload,
        userId: 999,
      },
    });

    const response = await PATCH(request);

    await expectJsonError(response, 400, "invalid_payload");
    expect(updateUserProfileByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 при невалидном поле профиля", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: {
        ...validPayload,
        gender: "admin",
      },
    });

    const response = await PATCH(request);

    await expectJsonError(response, 400, "invalid_payload");
    expect(updateUserProfileByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 при невалидном количестве нагрузок", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: {
        ...validPayload,
        weeklyWorkloadCount: 22,
      },
    });

    const response = await PATCH(request);

    await expectJsonError(response, 400, "invalid_payload");
    expect(updateUserProfileByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 400 при невалидной дате рождения или занятости", async () => {
    const invalidDateRequest = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: {
        ...validPayload,
        dateOfBirth: "9999-01-01",
      },
    });

    const invalidDateResponse = await PATCH(invalidDateRequest);

    await expectJsonError(invalidDateResponse, 400, "invalid_payload");

    const invalidOccupationRequest = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: {
        ...validPayload,
        occupation: "freelance",
      },
    });

    const invalidOccupationResponse = await PATCH(invalidOccupationRequest);

    await expectJsonError(invalidOccupationResponse, 400, "invalid_payload");
    expect(updateUserProfileByIdMock).not.toHaveBeenCalled();
  });

  it("должен возвращать 404 когда пользователь отсутствует", async () => {
    updateUserProfileByIdMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: validPayload,
    });

    const response = await PATCH(request);

    await expectJsonError(response, 404, "not_found");
  });

  it("должен обновлять профиль пользователя из сессии", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/setDataUser",
      method: "PATCH",
      body: {
        ...validPayload,
        lastName: "   ",
        patronymic: "   ",
        heightCm: null,
        weeklyWorkloadCount: null,
        dateOfBirth: null,
        occupation: null,
        miscellaneous: "   ",
      },
    });

    const response = await PATCH(request);
    const payload = await expectJsonSuccess<{
      success: boolean;
      user: { id: number; name: string; lastName: string | null; patronymic: string | null };
    }>(response, 200);

    expect(payload.success).toBe(true);
    expect(payload.user.id).toBe(13);
    expect(updateUserProfileByIdMock).toHaveBeenCalledWith(13, {
      name: "Ivan",
      lastName: null,
      patronymic: null,
      heightCm: null,
      weeklyWorkloadCount: null,
      gender: "male",
      dateOfBirth: null,
      occupation: null,
      miscellaneous: null,
      timezone: "Europe/Moscow",
    });
  });
});
