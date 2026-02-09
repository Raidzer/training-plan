import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const {
  authMock,
  isValidDateStringMock,
  getPlanEntrySummaryForUserMock,
  areShoesOwnedByUserMock,
  upsertWorkoutReportMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    getPlanEntrySummaryForUserMock: vi.fn(),
    areShoesOwnedByUserMock: vi.fn(),
    upsertWorkoutReportMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/diary", () => {
  return {
    isValidDateString: isValidDateStringMock,
  };
});

vi.mock("@/server/workoutReports", () => {
  return {
    getPlanEntrySummaryForUser: getPlanEntrySummaryForUserMock,
    areShoesOwnedByUser: areShoesOwnedByUserMock,
    upsertWorkoutReport: upsertWorkoutReportMock,
  };
});

import { POST } from "@/app/api/diary/workout-report/route";

function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    planEntryId: 100,
    date: "2026-01-03",
    startTime: "08:30",
    resultText: "Хорошая тренировка",
    commentText: "Комментарий",
    ...overrides,
  };
}

describe("POST /api/diary/workout-report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "15" }));
    isValidDateStringMock.mockReturnValue(true);
    getPlanEntrySummaryForUserMock.mockResolvedValue({
      id: 100,
      date: "2026-01-03",
    });
    areShoesOwnedByUserMock.mockResolvedValue(true);
    upsertWorkoutReportMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload(),
    });

    const response = await POST(request);
    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном planEntryId", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ planEntryId: 0 }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_plan_entry");
  });

  it("должен возвращать 400 при невалидной дате", async () => {
    isValidDateStringMock.mockReturnValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ date: "wrong" }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_date");
  });

  it("должен возвращать 400 при невалидном времени старта", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ startTime: "8:77" }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_time");
  });

  it("должен возвращать 400 при пустом resultText", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ resultText: "   " }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_result");
  });

  it("должен возвращать 400 при невалидной дистанции", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ distanceKm: -1 }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_distance");
  });

  it("должен возвращать 400 при невалидном списке обуви", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ shoeIds: [1, "bad"] }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_shoes");
  });

  it("должен возвращать 400 при невалидном hasWind", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ hasWind: "unknown" }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_wind");
  });

  it("должен возвращать 400 при невалидной температуре", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ temperatureC: "abc" }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_temperature");
  });

  it("должен возвращать 400 при невалидной оценке", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ overallScore: 11 }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_score");
  });

  it("должен возвращать 404, если plan элемент не найден", async () => {
    getPlanEntrySummaryForUserMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload(),
    });

    const response = await POST(request);
    await expectJsonError(response, 404, "not_found");
  });

  it("должен возвращать 400 при несовпадении даты", async () => {
    getPlanEntrySummaryForUserMock.mockResolvedValue({
      id: 100,
      date: "2026-01-04",
    });
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ date: "2026-01-03" }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "date_mismatch");
  });

  it("должен возвращать 400, если обувь не принадлежит пользователю", async () => {
    areShoesOwnedByUserMock.mockResolvedValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ shoeIds: [1, 2] }),
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_shoes");
  });

  it("должен отклонять слишком длинные погодные поля и поверхности", async () => {
    const longText = "x".repeat(256);
    const weatherRequest = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ weather: longText }),
    });

    const weatherResponse = await POST(weatherRequest);
    await expectJsonError(weatherResponse, 400, "invalid_weather");

    const surfaceRequest = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({ surface: longText }),
    });

    const surfaceResponse = await POST(surfaceRequest);
    await expectJsonError(surfaceResponse, 400, "invalid_surface");
  });

  it("должен сохранять уличный отчет с нормализацией полей", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({
        resultText: "  Результат  ",
        commentText: "  Комментарий  ",
        distanceKm: "10,5",
        overallScore: "8",
        functionalScore: "7",
        muscleScore: 6,
        weather: "sunny",
        hasWind: "false",
        temperatureC: "-3,44",
        surface: "asphalt",
        shoeIds: [1, 1, "2"],
      }),
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ ok: boolean }>(response, 200);

    expect(payload.ok).toBe(true);
    expect(getPlanEntrySummaryForUserMock).toHaveBeenCalledWith({
      userId: 15,
      planEntryId: 100,
    });
    expect(areShoesOwnedByUserMock).toHaveBeenCalledWith({
      userId: 15,
      shoeIds: [1, 2],
    });
    expect(upsertWorkoutReportMock).toHaveBeenCalledWith({
      userId: 15,
      planEntryId: 100,
      date: "2026-01-03",
      startTime: "08:30",
      resultText: "  Результат  ",
      commentText: "Комментарий",
      distanceKm: 10.5,
      overallScore: 8,
      functionalScore: 7,
      muscleScore: 6,
      surface: "asphalt",
      weather: "sunny",
      hasWind: false,
      temperatureC: -3.4,
      shoeIds: [1, 2],
    });
  });

  it("должен сбрасывать погодные поля для поверхности в помещении", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createValidPayload({
        surface: "manezh",
        weather: "rain",
        hasWind: "true",
        temperatureC: 5,
      }),
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ ok: boolean }>(response, 200);

    expect(payload.ok).toBe(true);
    expect(upsertWorkoutReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: "manezh",
        weather: null,
        hasWind: null,
        temperatureC: null,
      })
    );
  });
});
