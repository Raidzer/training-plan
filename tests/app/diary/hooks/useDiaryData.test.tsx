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

type JsonResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

function createJsonResponse(body: unknown, ok = true): JsonResponse {
  return {
    ok,
    json: async () => body,
  };
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

const createDayPayload = (params: {
  totalDistanceKm: number;
  workoutResult: string;
  hasBath: boolean;
  sleepHours: string | null;
  weightMorning: string;
}): DayPayload => ({
  planEntries: [
    {
      id: 1,
      date: "2025-12-29",
      sessionOrder: 1,
      taskText: "Интервалы",
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
      resultText: params.workoutResult,
      commentText: "",
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
      weightKg: params.weightMorning,
    },
  ],
  recoveryEntry: {
    id: 1,
    date: "2025-12-29",
    hasBath: params.hasBath,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: params.sleepHours,
  },
  status: {
    date: "2025-12-29",
    hasWeightMorning: true,
    hasWeightEvening: false,
    workoutsTotal: 1,
    workoutsWithFullReport: 1,
    dayHasReport: true,
    totalDistanceKm: params.totalDistanceKm,
  },
  previousEveningWeightKg: null,
});

describe("useDiaryData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("не должен сбрасывать несохраненные формы других блоков после сохранения веса", async () => {
    const initialDay = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "server-initial",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70.0",
    });
    const refreshedDay = createDayPayload({
      totalDistanceKm: 20,
      workoutResult: "server-refreshed",
      hasBath: false,
      sleepHours: "6",
      weightMorning: "71.3",
    });

    let dayRequestCount = 0;

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] }) as unknown as Response;
      }

      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [initialDay.status] }) as unknown as Response;
      }

      if (url.startsWith("/api/diary/day")) {
        dayRequestCount += 1;
        return createJsonResponse(
          dayRequestCount === 1 ? initialDay : refreshedDay
        ) as unknown as Response;
      }

      if (url === "/api/diary/weight" && init?.method === "POST") {
        return createJsonResponse({ ok: true }) as unknown as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    const messageApi = {
      error: vi.fn(),
      success: vi.fn(),
    };

    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(10);
      expect(result.current.workoutForm[1]?.resultText).toBe("server-initial");
    });

    act(() => {
      result.current.setWorkoutForm((prev) => ({
        ...prev,
        1: {
          ...prev[1],
          resultText: "draft-workout",
        },
      }));
      result.current.setRecoveryForm((prev) => ({
        ...prev,
        hasBath: true,
        sleepHours: "07:30",
      }));
      result.current.setWeightForm((prev) => ({
        ...prev,
        morning: "71.3",
      }));
    });

    await act(async () => {
      await result.current.handleSaveWeight("morning");
    });

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(20);
    });

    expect(result.current.workoutForm[1]?.resultText).toBe("draft-workout");
    expect(result.current.recoveryForm.hasBath).toBe(true);
    expect(result.current.recoveryForm.sleepHours).toBe("07:30");
    expect(result.current.weightForm.morning).toBe("71.3");
  });
});
