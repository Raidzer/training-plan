import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPayload } from "@/app/diary/DiaryClient/types/diaryTypes";
import type { DiaryMessages } from "@/app/diary/DiaryClient/hooks/useDiaryData";
import { useDiaryData } from "@/app/diary/DiaryClient/hooks/useDiaryData";

let queryDate: string | null = null;

vi.mock("next/navigation", () => {
  return {
    useSearchParams: () => ({
      get: (key: string) => {
        if (key === "date") {
          return queryDate;
        }
        return null;
      },
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

type FetchHandler = (url: string, init?: RequestInit) => Promise<Response>;

function setFetchHandler(handler: FetchHandler) {
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    return handler(String(input), init);
  }) as unknown as typeof fetch;
}

function createMessageApiMock() {
  return {
    error: vi.fn(),
    success: vi.fn(),
  };
}

const createDayPayload = (params: {
  date?: string;
  totalDistanceKm: number;
  workoutResult: string;
  hasBath: boolean;
  sleepHours: string | null;
  weightMorning: string;
}): DayPayload => ({
  planEntries: [
    {
      id: 1,
      date: params.date ?? "2025-12-29",
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
      date: params.date ?? "2025-12-29",
      startTime: "13:00",
      resultText: params.workoutResult,
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
      date: params.date ?? "2025-12-29",
      period: "morning",
      weightKg: params.weightMorning,
    },
  ],
  recoveryEntry: {
    id: 1,
    date: params.date ?? "2025-12-29",
    hasBath: params.hasBath,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: params.sleepHours,
  },
  status: {
    date: params.date ?? "2025-12-29",
    hasWeightMorning: true,
    hasWeightEvening: false,
    workoutsTotal: 1,
    workoutsWithFullReport: 1,
    dayHasReport: true,
    totalDistanceKm: params.totalDistanceKm,
  },
  previousEveningWeightKg: null,
});

function createDefaultDiaryFetchHandler(dayPayload: DayPayload): FetchHandler {
  return async (url) => {
    if (url.startsWith("/api/shoes")) {
      return createJsonResponse({ shoes: [{ id: 1, name: "Shoe" }] });
    }
    if (url.startsWith("/api/diary/marks")) {
      return createJsonResponse({ days: [dayPayload.status] });
    }
    if (url.startsWith("/api/diary/day")) {
      return createJsonResponse(dayPayload);
    }
    throw new Error(`Unexpected fetch call: ${url}`);
  };
}

describe("useDiaryData (extended)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryDate = null;
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

    setFetchHandler(async (url, init) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] });
      }

      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [initialDay.status] });
      }

      if (url.startsWith("/api/diary/day")) {
        dayRequestCount += 1;
        if (dayRequestCount === 1) {
          return createJsonResponse(initialDay);
        }
        return createJsonResponse(refreshedDay);
      }

      if (url === "/api/diary/weight" && init?.method === "POST") {
        return createJsonResponse({ ok: true });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const messageApi = createMessageApiMock();
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

  it("должен показывать ошибку загрузки обуви при ответе с ошибкой", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(async (url) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({}, 500);
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [dayPayload.status] });
      }
      if (url.startsWith("/api/diary/day")) {
        return createJsonResponse(dayPayload);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(10);
    });

    await waitFor(() => {
      expect(messageApi.error).toHaveBeenCalledWith(messages.shoesLoadFailed);
    });

    expect(result.current.shoes).toEqual([]);
  });

  it("должен показывать ошибку загрузки отметок при неуспешном ответе", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(async (url) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] });
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ error: "server-marks-error" }, 400);
      }
      if (url.startsWith("/api/diary/day")) {
        return createJsonResponse(dayPayload);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const messageApi = createMessageApiMock();
    renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(messageApi.error).toHaveBeenCalledWith("server-marks-error");
    });
  });

  it("должен валидировать вес перед сохранением", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(createDefaultDiaryFetchHandler(dayPayload));

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(10);
    });

    act(() => {
      result.current.setWeightForm((prev) => ({
        ...prev,
        morning: "abc",
      }));
    });

    await act(async () => {
      await result.current.handleSaveWeight("morning");
    });

    expect(messageApi.error).toHaveBeenCalledWith(messages.weightInvalid);
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/diary/weight",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("должен показывать ошибку сервера при сохранении веса", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(async (url, init) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] });
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [dayPayload.status] });
      }
      if (url.startsWith("/api/diary/day")) {
        return createJsonResponse(dayPayload);
      }
      if (url === "/api/diary/weight" && init?.method === "POST") {
        return createJsonResponse({ error: "weight-server-error" }, 400);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(10);
    });

    act(() => {
      result.current.setWeightForm((prev) => ({
        ...prev,
        morning: "71.4",
      }));
    });

    await act(async () => {
      await result.current.handleSaveWeight("morning");
    });

    expect(messageApi.error).toHaveBeenCalledWith("weight-server-error");
    expect(messageApi.success).not.toHaveBeenCalledWith(messages.weightSaved);
  });

  it("должен требовать обязательные поля отчета тренировки", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(createDefaultDiaryFetchHandler(dayPayload));

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
          startTime: "",
          resultText: "   ",
        },
      }));
    });

    await act(async () => {
      await result.current.handleSaveWorkout(1);
    });

    expect(messageApi.error).toHaveBeenCalledWith(messages.workoutRequired);
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/diary/workout-report",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("должен очищать погодные поля для закрытого помещения и дедуплицировать shoeIds", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    let savedWorkoutBody: Record<string, unknown> | null = null;

    setFetchHandler(async (url, init) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({
          shoes: [
            { id: 1, name: "A" },
            { id: 2, name: "B" },
          ],
        });
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [dayPayload.status] });
      }
      if (url.startsWith("/api/diary/day")) {
        return createJsonResponse(dayPayload);
      }
      if (url === "/api/diary/workout-report" && init?.method === "POST") {
        savedWorkoutBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return createJsonResponse({ ok: true });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

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
          resultText: "done",
          distanceKm: "12,5",
          weather: "rain",
          hasWind: "true",
          temperatureC: "5",
          surface: "manezh",
          shoeIds: [1, 1, 2, -5 as unknown as number],
        },
      }));
    });

    await act(async () => {
      await result.current.handleSaveWorkout(1);
    });

    expect(savedWorkoutBody).not.toBeNull();
    expect(savedWorkoutBody?.weather).toBeNull();
    expect(savedWorkoutBody?.hasWind).toBeNull();
    expect(savedWorkoutBody?.temperatureC).toBeNull();
    expect(savedWorkoutBody?.distanceKm).toBe(12.5);
    expect(savedWorkoutBody?.shoeIds).toEqual([1, 2]);
    expect(messageApi.success).toHaveBeenCalledWith(messages.workoutSaved);
  });

  it("должен валидировать температуру для открытой поверхности", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(createDefaultDiaryFetchHandler(dayPayload));

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
          resultText: "done",
          surface: "asphalt",
          temperatureC: "abc",
        },
      }));
    });

    await act(async () => {
      await result.current.handleSaveWorkout(1);
    });

    expect(messageApi.error).toHaveBeenCalledWith(messages.workoutTemperatureInvalid);
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/diary/workout-report",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("должен валидировать формат сна при сохранении восстановления", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(createDefaultDiaryFetchHandler(dayPayload));

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(10);
    });

    act(() => {
      result.current.setRecoveryForm((prev) => ({
        ...prev,
        sleepHours: "25:30",
      }));
    });

    await act(async () => {
      await result.current.handleSaveRecovery();
    });

    expect(messageApi.error).toHaveBeenCalledWith(messages.recoveryInvalidSleep);
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/diary/recovery",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("должен сохранять восстановление с нормализованным sleepHours", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    let recoveryBody: Record<string, unknown> | null = null;

    setFetchHandler(async (url, init) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] });
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [dayPayload.status] });
      }
      if (url.startsWith("/api/diary/day")) {
        return createJsonResponse(dayPayload);
      }
      if (url === "/api/diary/recovery" && init?.method === "POST") {
        recoveryBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return createJsonResponse({ ok: true });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(10);
    });

    act(() => {
      result.current.setRecoveryForm((prev) => ({
        ...prev,
        hasBath: true,
        hasMfr: true,
        hasMassage: false,
        sleepHours: "07:30",
      }));
    });

    await act(async () => {
      await result.current.handleSaveRecovery();
    });

    expect(recoveryBody).not.toBeNull();
    expect(recoveryBody?.sleepHours).toBe(7.5);
    expect(recoveryBody?.hasBath).toBe(true);
    expect(recoveryBody?.hasMfr).toBe(true);
    expect(messageApi.success).toHaveBeenCalledWith(messages.recoverySaved);
  });

  it("должен игнорировать устаревший ответ loadDay", async () => {
    const firstDay = createDayPayload({
      date: "2026-01-01",
      totalDistanceKm: 11,
      workoutResult: "old",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });
    const secondDay = createDayPayload({
      date: "2026-01-02",
      totalDistanceKm: 22,
      workoutResult: "new",
      hasBath: true,
      sleepHours: "7",
      weightMorning: "71",
    });

    let firstDayResolver: ((value: Response) => void) | null = null;
    let dayRequestIndex = 0;

    setFetchHandler(async (url) => {
      if (url.startsWith("/api/shoes")) {
        return createJsonResponse({ shoes: [] });
      }
      if (url.startsWith("/api/diary/marks")) {
        return createJsonResponse({ days: [firstDay.status, secondDay.status] });
      }
      if (url.startsWith("/api/diary/day")) {
        dayRequestIndex += 1;
        if (dayRequestIndex === 1) {
          return new Promise((resolve) => {
            firstDayResolver = resolve;
          });
        }
        return createJsonResponse(secondDay);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(dayRequestIndex).toBeGreaterThanOrEqual(1);
    });

    act(() => {
      result.current.updateSelectedDate(dayjs("2026-01-02"));
    });

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(22);
    });

    if (!firstDayResolver) {
      throw new Error("firstDayResolver is not set");
    }

    act(() => {
      firstDayResolver(createJsonResponse(firstDay));
    });

    await waitFor(() => {
      expect(result.current.dayData?.status.totalDistanceKm).toBe(22);
      expect(result.current.dayData?.workoutReports[0]?.resultText).toBe("new");
    });
  });

  it("должен смещать selectedDate через shiftDate", async () => {
    const dayPayload = createDayPayload({
      totalDistanceKm: 10,
      workoutResult: "ok",
      hasBath: false,
      sleepHours: "8",
      weightMorning: "70",
    });

    setFetchHandler(createDefaultDiaryFetchHandler(dayPayload));

    const messageApi = createMessageApiMock();
    const { result } = renderHook(() => useDiaryData({ messageApi, messages }));

    await waitFor(() => {
      expect(result.current.selectedDate.isValid()).toBe(true);
    });

    const initialDate = result.current.selectedDate;

    act(() => {
      result.current.shiftDate(1, "day");
    });

    await waitFor(() => {
      expect(result.current.selectedDate.diff(initialDate, "day")).toBe(1);
    });
  });
});
