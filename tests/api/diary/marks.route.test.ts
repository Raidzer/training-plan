import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestWithQuery,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, getDiaryDaysInRangeMock, isValidDateStringMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getDiaryDaysInRangeMock: vi.fn(),
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
    getDiaryDaysInRange: getDiaryDaysInRangeMock,
    isValidDateString: isValidDateStringMock,
  };
});

import { GET } from "@/app/api/diary/marks/route";

describe("GET /api/diary/marks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "7" }));
    isValidDateStringMock.mockReturnValue(true);
    getDiaryDaysInRangeMock.mockResolvedValue([
      {
        date: "2026-01-01",
        hasWeightMorning: true,
        hasWeightEvening: false,
        workoutsTotal: 1,
        workoutsWithFullReport: 1,
        dayHasReport: true,
        totalDistanceKm: 10,
      },
    ]);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const request = createRequestWithQuery({
      path: "/api/diary/marks",
      query: { from: "2026-01-01", to: "2026-01-31" },
    });
    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидном диапазоне", async () => {
    isValidDateStringMock.mockReturnValue(false);

    const request = createRequestWithQuery({
      path: "/api/diary/marks",
      query: { from: "bad", to: "2026-01-31" },
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
  });

  it("должен возвращать 400, если из больше в", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/marks",
      query: { from: "2026-02-01", to: "2026-01-01" },
    });
    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
    expect(getDiaryDaysInRangeMock).not.toHaveBeenCalled();
  });

  it("должен возвращать дни при валидном запросе", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/marks",
      query: { from: "2026-01-01", to: "2026-01-31" },
    });
    const response = await GET(request);

    const payload = await expectJsonSuccess<{ days: Array<{ date: string }> }>(response, 200);
    expect(payload.days).toHaveLength(1);
    expect(payload.days[0].date).toBe("2026-01-01");
    expect(getDiaryDaysInRangeMock).toHaveBeenCalledWith({
      userId: 7,
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });
});
