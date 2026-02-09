import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPayload } from "@/app/diary/DiaryClient/types/diaryTypes";
import type { DiaryMessages } from "@/app/diary/DiaryClient/hooks/useDiaryData";
import { useDiaryData } from "@/app/diary/DiaryClient/hooks/useDiaryData";

vi.mock("next/navigation", () => {
  return {
    useSearchParams: () => ({
      get: () => null,
    }),
  };
});

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

const messages: DiaryMessages = {
  marksLoadFailed: "marksLoadFailed",
  dayLoadFailed: "dayLoadFailed",
  weightInvalid: "weightInvalid",
  weightSaveFailed: "weightSaveFailed",
  weightSaved: "weightSaved",
  workoutRequired: "workoutRequired",
  workoutDistanceInvalid: "workoutDistanceInvalid",
  workoutTemperatureInvalid: "workoutTemperatureInvalid",
  workoutSaveFailed: "workoutSaveFailed",
  workoutSaved: "workoutSaved",
  recoveryInvalidSleep: "recoveryInvalidSleep",
  recoverySaveFailed: "recoverySaveFailed",
  recoverySaved: "recoverySaved",
  shoesLoadFailed: "shoesLoadFailed",
};

function createMessageApiMock() {
  return {
    error: vi.fn(),
    success: vi.fn(),
  };
}

const createDayPayload = (): DayPayload => ({
  planEntries: [
    {
      id: 1,
      date: "2025-12-29",
      sessionOrder: 1,
      taskText: "Intervals",
      commentText: null,
      isWorkload: true,
    },
  ],
  workoutReports: [
    {
      id: 1,
      planEntryId: 1,
      date: "2025-12-29",
      startTime: "13:00",
      resultText: "server-value",
      commentText: "server-comment",
      distanceKm: "10",
      overallScore: 7,
      functionalScore: 7,
      muscleScore: 7,
      weather: null,
      hasWind: null,
      temperatureC: null,
      surface: null,
      shoes: [],
    },
  ],
  weightEntries: [
    {
      id: 1,
      date: "2025-12-29",
      period: "morning",
      weightKg: "70.0",
    },
  ],
  recoveryEntry: {
    id: 1,
    date: "2025-12-29",
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: "8",
  },
  status: {
    date: "2025-12-29",
    hasWeightMorning: true,
    hasWeightEvening: false,
    workoutsTotal: 1,
    workoutsWithFullReport: 1,
    dayHasReport: true,
    totalDistanceKm: 10,
  },
  previousEveningWeightKg: null,
});

describe("useDiaryData (repeat save)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should keep resultText stable across repeated workout saves", async () => {
    const dayPayload = createDayPayload();
    const postedBodies: Record<string, unknown>[] = [];
    const constructorResult = "4km=16:48\n\n200m=(50;49;48)\n\n100m=(22;21;20)";

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] });
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [dayPayload.status] });
      }
      if (url.startsWith("/api/diary/day")) {
        return createJsonResponse(dayPayload);
      }
      if (url === "/api/diary/workout-report" && init?.method === "POST") {
        postedBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return createJsonResponse({ ok: true });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.workoutForm[1]).toBeDefined();
    });

    act(() => {
      result.current.setWorkoutForm((prev) => ({
        ...prev,
        1: {
          ...prev[1],
          startTime: "09:30",
          resultText: constructorResult,
          commentText: "comment",
        },
      }));
    });

    await act(async () => {
      await result.current.handleSaveWorkout(1);
    });

    act(() => {
      result.current.setWorkoutForm((prev) => ({
        ...prev,
        1: {
          ...prev[1],
          resultText: constructorResult,
        },
      }));
    });

    await act(async () => {
      await result.current.handleSaveWorkout(1);
    });

    expect(postedBodies).toHaveLength(2);
    expect(postedBodies[0]?.resultText).toBe(constructorResult);
    expect(postedBodies[1]?.resultText).toBe(constructorResult);
  });
});
