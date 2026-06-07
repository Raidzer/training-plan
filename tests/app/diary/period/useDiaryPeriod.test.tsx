import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DIARY_PERIOD_LABELS } from "@/app/diary/period/DiaryPeriodClient/constants/periodConstants";
import { useDiaryPeriod } from "@/app/diary/period/DiaryPeriodClient/hooks/useDiaryPeriod";
import type {
  DayStatus,
  PeriodTotals,
} from "@/app/diary/period/DiaryPeriodClient/types/periodTypes";

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

vi.mock("@/app/diary/period/DiaryPeriodClient/utils/periodUtils", async () => {
  const actual = await vi.importActual<
    typeof import("@/app/diary/period/DiaryPeriodClient/utils/periodUtils")
  >("@/app/diary/period/DiaryPeriodClient/utils/periodUtils");

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

function createDayStatus(overrides: Partial<DayStatus> = {}): DayStatus {
  return {
    date: "2026-05-10",
    hasWeightMorning: true,
    hasWeightEvening: false,
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
    expect(downloadBlobMock).toHaveBeenCalledWith(expect.any(Blob), "period.xlsx");
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
