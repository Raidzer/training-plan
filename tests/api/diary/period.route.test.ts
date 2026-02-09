import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestWithQuery,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, isValidDateStringMock, getDiaryDaysInRangeMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    getDiaryDaysInRangeMock: vi.fn(),
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
    getDiaryDaysInRange: getDiaryDaysInRangeMock,
  };
});

import { GET } from "@/app/api/diary/period/route";

describe("GET /api/diary/period", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "41" }));
    isValidDateStringMock.mockReturnValue(true);
    getDiaryDaysInRangeMock.mockResolvedValue([
      {
        date: "2026-02-01",
        hasWeightMorning: true,
        hasWeightEvening: false,
        hasBath: true,
        hasMfr: false,
        hasMassage: false,
        workoutsTotal: 2,
        workoutsWithFullReport: 1,
        dayHasReport: false,
        totalDistanceKm: 12,
      },
      {
        date: "2026-02-02",
        hasWeightMorning: true,
        hasWeightEvening: true,
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        workoutsTotal: 1,
        workoutsWithFullReport: 1,
        dayHasReport: true,
        totalDistanceKm: 8,
      },
    ]);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createRequestWithQuery({
      path: "/api/diary/period",
      query: { from: "2026-02-01", to: "2026-02-02" },
    });

    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя", async () => {
    authMock.mockResolvedValue(createSession({ id: "0" }));
    const request = createRequestWithQuery({
      path: "/api/diary/period",
      query: { from: "2026-02-01", to: "2026-02-02" },
    });

    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном диапазоне", async () => {
    isValidDateStringMock.mockReturnValue(false);
    const request = createRequestWithQuery({
      path: "/api/diary/period",
      query: { from: "bad", to: "2026-02-02" },
    });

    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
  });

  it("должен возвращать 400, когда from больше to", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period",
      query: { from: "2026-02-03", to: "2026-02-02" },
    });

    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
  });

  it("должен возвращать дни и агрегированные итоги при валидном диапазоне", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period",
      query: { from: "2026-02-01", to: "2026-02-02" },
    });

    const response = await GET(request);
    const payload = await expectJsonSuccess<{
      days: Array<{ date: string }>;
      totals: {
        daysComplete: number;
        workoutsTotal: number;
        workoutsWithFullReport: number;
        weightEntries: number;
      };
    }>(response, 200);

    expect(payload.days).toHaveLength(2);
    expect(payload.totals).toEqual({
      daysComplete: 1,
      workoutsTotal: 3,
      workoutsWithFullReport: 2,
      weightEntries: 3,
    });
    expect(getDiaryDaysInRangeMock).toHaveBeenCalledWith({
      userId: 41,
      from: "2026-02-01",
      to: "2026-02-02",
      includeEmpty: true,
    });
  });
});
