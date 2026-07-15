import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DIARY_PERIOD_LABELS } from "@/app/(protected)/diary/period/DiaryPeriodClient/constants/periodConstants";
import { useDiaryPeriod } from "@/app/(protected)/diary/period/DiaryPeriodClient/hooks/useDiaryPeriod";
import type {
  DayStatus,
  PeriodTotals,
} from "@/app/(protected)/diary/period/DiaryPeriodClient/types/periodTypes";

const messageApiMock = vi.hoisted(() => ({
  error: vi.fn(),
}));

const downloadBlobMock = vi.hoisted(() => vi.fn());

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  return {
    ...actual,
    message: {
      ...actual.message,
      useMessage: vi.fn(() => [messageApiMock, null]),
    },
  };
});

vi.mock("@/app/(protected)/diary/period/DiaryPeriodClient/utils/periodUtils", async () => {
  const actual = await vi.importActual<
    typeof import("@/app/(protected)/diary/period/DiaryPeriodClient/utils/periodUtils")
  >("@/app/(protected)/diary/period/DiaryPeriodClient/utils/periodUtils");

  return {
    ...actual,
    downloadBlob: downloadBlobMock,
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

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return {
    promise,
    resolve,
  };
}

function createDayStatus(overrides: Partial<DayStatus> = {}): DayStatus {
  return {
    date: "2026-05-10",
    hasWeightMorning: true,
    hasWeightEvening: false,
    hasSleep: true,
    hasBath: true,
    hasMfr: false,
    hasMassage: false,
    workoutsTotal: 2,
    workoutsWithFullReport: 1,
    dayHasReport: true,
    totalDistanceKm: 12.5,
    ...overrides,
  };
}

function createTotals(overrides: Partial<PeriodTotals> = {}): PeriodTotals {
  return {
    daysComplete: 1,
    workoutsTotal: 2,
    workoutsWithFullReport: 1,
    weightEntries: 1,
    ...overrides,
  };
}

describe("useDiaryPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadBlobMock.mockClear();
    messageApiMock.error.mockClear();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("loads period data on mount", async () => {
    const day = createDayStatus();
    const totals = createTotals();
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        days: [day],
        totals,
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.days).toEqual([day]);
    expect(result.current.totals).toEqual(totals);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/diary/period?from=");
  });

  it("reloads period when range changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          days: [],
          totals: createTotals({
            daysComplete: 0,
            workoutsTotal: 0,
            workoutsWithFullReport: 0,
            weightEntries: 0,
          }),
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          days: [createDayStatus({ date: "2026-06-01" })],
          totals: createTotals(),
        })
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.handleRangeChange([dayjs("2026-06-01"), dayjs("2026-06-07")]);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "/api/diary/period?from=2026-06-01&to=2026-06-07"
    );
  });

  it("aborts an outdated request and ignores its late response", async () => {
    const initialRequest = createDeferred<Response>();
    const latestRequest = createDeferred<Response>();
    const requestSignals: AbortSignal[] = [];
    const latestDay = createDayStatus({ date: "2026-06-07" });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.signal) {
          requestSignals.push(init.signal);
        }

        return initialRequest.promise;
      })
      .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.signal) {
          requestSignals.push(init.signal);
        }

        return latestRequest.promise;
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.handleRangeChange([dayjs("2026-06-01"), dayjs("2026-06-07")]);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(requestSignals).toHaveLength(2);
    expect(requestSignals[0]?.aborted).toBe(true);
    expect(requestSignals[1]?.aborted).toBe(false);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      latestRequest.resolve(
        createJsonResponse({
          days: [latestDay],
          totals: createTotals(),
        })
      );
      await latestRequest.promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.days).toEqual([latestDay]);
    });

    await act(async () => {
      initialRequest.resolve(createJsonResponse({ error: "Устаревшая ошибка" }, 500));
      await initialRequest.promise;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.days).toEqual([latestDay]);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(messageApiMock.error).not.toHaveBeenCalled();
  });

  it("clears a load error and retries the current period", async () => {
    const retryRequest = createDeferred<Response>();
    const requestSignals: AbortSignal[] = [];
    const retryDay = createDayStatus({ date: "2026-07-01" });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.signal) {
          requestSignals.push(init.signal);
        }

        return Promise.resolve(createJsonResponse({ error: "Сервис временно недоступен" }, 503));
      })
      .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.signal) {
          requestSignals.push(init.signal);
        }

        return retryRequest.promise;
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Сервис временно недоступен");
    });

    expect(result.current.days).toEqual([]);
    expect(result.current.totals).toEqual({
      daysComplete: 0,
      workoutsTotal: 0,
      workoutsWithFullReport: 0,
      weightEntries: 0,
    });
    expect(messageApiMock.error).toHaveBeenCalledWith("Сервис временно недоступен");

    act(() => {
      result.current.handleRetry();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(requestSignals).toHaveLength(2);
    expect(requestSignals[0]?.aborted).toBe(true);
    expect(requestSignals[1]?.aborted).toBe(false);

    await act(async () => {
      retryRequest.resolve(
        createJsonResponse({
          days: [retryDay],
          totals: createTotals(),
        })
      );
      await retryRequest.promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.days).toEqual([retryDay]);
      expect(result.current.error).toBeNull();
    });

    expect(messageApiMock.error).toHaveBeenCalledTimes(1);
  });

  it("exports current period with filename from response headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          days: [],
          totals: createTotals(),
        })
      )
      .mockResolvedValueOnce(
        new Response("xlsx", {
          status: 200,
          headers: {
            "content-disposition": 'attachment; filename="period.xlsx"',
          },
        })
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleExport();
    });

    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/api/diary/period-export?from=");
    expect(downloadBlobMock).toHaveBeenCalledTimes(1);
    expect(downloadBlobMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        size: 4,
        type: "text/plain;charset=utf-8",
      })
    );
    expect(downloadBlobMock.mock.calls[0]?.[1]).toBe("period.xlsx");
  });

  it("exports full diary through scope all", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          days: [],
          totals: createTotals(),
        })
      )
      .mockResolvedValueOnce(
        new Response("xlsx", {
          status: 200,
          headers: {
            "content-disposition": 'attachment; filename="diary_all.xlsx"',
          },
        })
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleExportAll();
    });

    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/diary/period-export?scope=all");
    expect(downloadBlobMock).toHaveBeenCalledTimes(1);
    expect(downloadBlobMock.mock.calls[0]?.[1]).toBe("diary_all.xlsx");
  });

  it("shows API export error and does not download file", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          days: [],
          totals: createTotals(),
        })
      )
      .mockResolvedValueOnce(createJsonResponse({ error: "Нет данных" }, 400));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDiaryPeriod());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleExport();
    });

    expect(messageApiMock.error).toHaveBeenCalledWith("Нет данных");
    expect(messageApiMock.error).not.toHaveBeenCalledWith(DIARY_PERIOD_LABELS.exportFail);
    expect(downloadBlobMock).not.toHaveBeenCalled();
  });
});
