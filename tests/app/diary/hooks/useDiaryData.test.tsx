import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPayload } from "@/app/(protected)/diary/DiaryClient/types/diaryTypes";
import type { DiaryMessages } from "@/app/(protected)/diary/DiaryClient/hooks/useDiaryData";
import { useDiaryData } from "@/app/(protected)/diary/DiaryClient/hooks/useDiaryData";

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
  workoutShoeMileageInvalid: "workoutShoeMileageInvalid",
  workoutTemperatureInvalid: "workoutTemperatureInvalid",
  workoutSaveFailed: "workoutSaveFailed",
  workoutSaved: "workoutSaved",
  workoutEditRequired: "workoutEditRequired",
  workoutEditNotFound: "workoutEditNotFound",
  workoutEditSaveFailed: "workoutEditSaveFailed",
  workoutEditSaved: "workoutEditSaved",
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
    recoveryOther: "",
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: params.sleepHours,
    additionalSleepHours: null,
  },
  status: {
    date: "2025-12-29",
    hasWeightMorning: true,
    hasWeightEvening: false,
    hasSleep: params.sleepHours !== null,
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
        recoveryOther: "Контрастный душ",
        sleepHours: "07:30",
        additionalSleepHours: "00:35",
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
    expect(result.current.recoveryForm.recoveryOther).toBe("Контрастный душ");
    expect(result.current.recoveryForm.sleepHours).toBe("07:30");
    expect(result.current.recoveryForm.additionalSleepHours).toBe("00:35");
    expect(result.current.weightForm.morning).toBe("71.3");
  });

  it("не должен обновлять старую дату и месяц после переключения во время сохранения", async () => {
    const day = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "server-initial",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70.0",
    });
    let resolveWeightSave!: (response: Response) => void;
    const weightSaveRequest = new Promise<Response>((resolve) => {
      resolveWeightSave = resolve;
    });
    const requestsAfterSaveStarted: string[] = [];
    let saveStarted = false;

    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (saveStarted && init?.method !== "POST") {
        requestsAfterSaveStarted.push(url);
      }

      if (url.startsWith("/api/shoes")) {
        return Promise.resolve(createJsonResponse({ shoes: [] }) as unknown as Response);
      }

      if (url.startsWith("/api/diary/marks")) {
        return Promise.resolve(createJsonResponse({ days: [day.status] }) as unknown as Response);
      }

      if (url.startsWith("/api/diary/day")) {
        return Promise.resolve(createJsonResponse(day) as unknown as Response);
      }

      if (url === "/api/diary/weight" && init?.method === "POST") {
        saveStarted = true;
        return weightSaveRequest;
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof fetch;

    const messageApi = {
      error: vi.fn(),
      success: vi.fn(),
    };
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.loadingDay).toBe(false);
      expect(result.current.loadingMarks).toBe(false);
      expect(result.current.loadingShoes).toBe(false);
    });

    const initialDate = result.current.selectedDate;
    const initialPanelDate = result.current.panelDate;
    const initialDayUrl = `/api/diary/day?date=${initialDate.format("YYYY-MM-DD")}`;
    const initialMarksUrl =
      vi
        .mocked(global.fetch)
        .mock.calls.map(([input]) => String(input))
        .find((url) => url.startsWith("/api/diary/marks")) ?? "";

    expect(initialMarksUrl).not.toBe("");

    act(() => {
      result.current.setWeightForm((previousForm) => ({
        ...previousForm,
        morning: "71.3",
      }));
    });

    let savePromise!: Promise<void>;

    await act(async () => {
      savePromise = result.current.handleSaveWeight("morning");
      await Promise.resolve();
    });

    const nextDate = initialDate.add(1, "month").startOf("month");
    const nextPanelDate = initialPanelDate.add(2, "month").startOf("month");

    act(() => {
      result.current.updateSelectedDate(nextDate);
      result.current.setPanelDate(nextPanelDate);
    });

    await waitFor(() => {
      expect(requestsAfterSaveStarted).toContain(
        `/api/diary/day?date=${nextDate.format("YYYY-MM-DD")}`
      );
      expect(requestsAfterSaveStarted.some((url) => url.startsWith("/api/diary/marks"))).toBe(true);
    });

    await act(async () => {
      resolveWeightSave(createJsonResponse({ ok: true }) as unknown as Response);
      await savePromise;
    });

    expect(requestsAfterSaveStarted).not.toContain(initialDayUrl);
    expect(requestsAfterSaveStarted).not.toContain(initialMarksUrl);
  });
});
