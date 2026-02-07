import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestWithQuery,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, getDiaryDayDataMock, isValidDateStringMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getDiaryDayDataMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/diary", () => {
  return {
    getDiaryDayData: getDiaryDayDataMock,
    isValidDateString: isValidDateStringMock,
  };
});

import { GET } from "@/app/api/diary/day/route";

const dayPayload = {
  planEntries: [],
  workoutReports: [],
  weightEntries: [],
  recoveryEntry: {
    date: "2026-01-10",
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: null,
  },
  status: {
    date: "2026-01-10",
    hasWeightMorning: false,
    hasWeightEvening: false,
    workoutsTotal: 0,
    workoutsWithFullReport: 0,
    dayHasReport: false,
    totalDistanceKm: 0,
  },
  previousEveningWeightKg: null,
};

describe("GET /api/diary/day", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "5" }));
    isValidDateStringMock.mockReturnValue(true);
    getDiaryDayDataMock.mockResolvedValue(dayPayload);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const request = createRequestWithQuery({
      path: "/api/diary/day",
      query: { date: "2026-01-10" },
    });
    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном user id", async () => {
    authMock.mockResolvedValue(createSession({ id: "0" }));

    const request = createRequestWithQuery({
      path: "/api/diary/day",
      query: { date: "2026-01-10" },
    });
    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидной дате", async () => {
    isValidDateStringMock.mockReturnValue(false);

    const request = createRequestWithQuery({
      path: "/api/diary/day",
      query: { date: "invalid" },
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_date");
  });

  it("должен возвращать 400 при отсутствии даты", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/day",
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_date");
    expect(getDiaryDayDataMock).not.toHaveBeenCalled();
  });

  it("должен возвращать данные дня", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/day",
      query: { date: "2026-01-10" },
    });
    const response = await GET(request);

    const payload = await expectJsonSuccess<{
      date: string;
      status: { date: string };
      planEntries: unknown[];
    }>(response, 200);

    expect(payload.date).toBe("2026-01-10");
    expect(payload.status.date).toBe("2026-01-10");
    expect(Array.isArray(payload.planEntries)).toBe(true);
    expect(getDiaryDayDataMock).toHaveBeenCalledWith({
      userId: 5,
      date: "2026-01-10",
    });
  });
});
