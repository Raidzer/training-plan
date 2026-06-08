import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RECORDS_LABELS } from "@/app/profile/records/RecordsClient/constants/recordsConstants";
import { useRecords } from "@/app/profile/records/RecordsClient/hooks/useRecords";
import type { ApiRecord } from "@/app/profile/records/RecordsClient/types/recordsTypes";
import type { MessageInstance } from "antd/es/message/interface";

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
  } as unknown as MessageInstance;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createApiRecord(overrides: Partial<ApiRecord> = {}): ApiRecord {
  return {
    distanceKey: "5k",
    timeText: "00:18:30",
    recordDate: "2026-05-10",
    protocolUrl: null,
    raceName: "Spring Run",
    raceCity: "Moscow",
    ...overrides,
  };
}

describe("useRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("loads records and maps them to editable rows", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        records: [createApiRecord()],
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();

    const { result } = renderHook(() =>
      useRecords({
        apiUrl: "/api/personal-records",
        messageApi,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fiveKmRow = result.current.rows.find((row) => row.distanceKey === "5k");

    expect(fetchMock).toHaveBeenCalledWith("/api/personal-records", {
      cache: "no-store",
    });
    expect(fiveKmRow).toMatchObject({
      timeText: "00:18:30",
      raceName: "Spring Run",
      raceCity: "Moscow",
    });
    expect(fiveKmRow?.recordDate?.format("YYYY-MM-DD")).toBe("2026-05-10");
  });

  it("shows validation errors before save request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ records: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();

    const { result } = renderHook(() =>
      useRecords({
        apiUrl: "/api/personal-records",
        messageApi,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleFieldChange("5k", {
        timeText: "bad-time",
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(messageApi.error).toHaveBeenCalledWith(RECORDS_LABELS.invalidTime);
    expect(result.current.errors["5k"]).toEqual({
      time: true,
      date: true,
    });
  });

  it.each([
    [
      "date",
      { timeText: "00:18:30", recordDate: null },
      RECORDS_LABELS.invalidDate,
      { date: true },
    ],
    [
      "url",
      {
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
        protocolUrl: `https://example.com/${"a".repeat(2050)}`,
      },
      RECORDS_LABELS.invalidUrl,
      { url: true },
    ],
    [
      "raceName",
      {
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
        raceName: "a".repeat(256),
      },
      RECORDS_LABELS.invalidRaceName,
      { raceName: true },
    ],
    [
      "raceCity",
      {
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
        raceCity: "a".repeat(256),
      },
      RECORDS_LABELS.invalidRaceCity,
      { raceCity: true },
    ],
  ] as const)(
    "shows %s validation message before save",
    async (_, patch, message, expectedError) => {
      const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ records: [] }));
      global.fetch = fetchMock as unknown as typeof fetch;
      const messageApi = createMessageApi();

      const { result } = renderHook(() =>
        useRecords({
          apiUrl: "/api/personal-records",
          messageApi,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleFieldChange("5k", patch);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(messageApi.error).toHaveBeenCalledWith(message);
      expect(result.current.errors["5k"]).toEqual(expectedError);
    }
  );

  it("clears row errors when field changes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ records: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();

    const { result } = renderHook(() =>
      useRecords({
        apiUrl: "/api/personal-records",
        messageApi,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleFieldChange("5k", {
        timeText: "bad-time",
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    act(() => {
      result.current.handleFieldChange("5k", {
        timeText: "00:18:30",
      });
    });

    expect(result.current.errors).toEqual({});
  });

  it("saves normalized records and refreshes rows from response", async () => {
    const savedRecord = createApiRecord({
      timeText: "00:18.30",
      recordDate: "2026-05-10",
      protocolUrl: "https://example.com/protocol",
      raceName: "Spring Run",
      raceCity: "Moscow",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ records: [] }))
      .mockResolvedValueOnce(createJsonResponse({ records: [savedRecord] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();

    const { result } = renderHook(() =>
      useRecords({
        apiUrl: "/api/personal-records",
        messageApi,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleFieldChange("5k", {
        timeText: " 00:18,30 ",
        recordDate: dayjs("2026-05-10"),
        protocolUrl: " https://example.com/protocol ",
        raceName: " Spring Run ",
        raceCity: " Moscow ",
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    const saveRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const saveBody = JSON.parse(String(saveRequest.body)) as {
      records: Array<{ distanceKey: string; timeText: string; recordDate: string | null }>;
    };
    const savedFiveKm = saveBody.records.find((record) => record.distanceKey === "5k");

    expect(saveRequest.method).toBe("POST");
    expect(savedFiveKm).toMatchObject({
      timeText: "00:18.30",
      recordDate: "2026-05-10",
    });
    expect(messageApi.success).toHaveBeenCalledWith(RECORDS_LABELS.saveOk);
    expect(result.current.rows.find((row) => row.distanceKey === "5k")).toMatchObject({
      timeText: "00:18.30",
      raceName: "Spring Run",
    });
  });

  it("shows save error for failed response and network error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ records: [] }))
      .mockResolvedValueOnce(createJsonResponse({ error: "failed" }, 500))
      .mockRejectedValueOnce(new Error("network"));
    global.fetch = fetchMock as unknown as typeof fetch;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const messageApi = createMessageApi();

    const { result } = renderHook(() =>
      useRecords({
        apiUrl: "/api/personal-records",
        messageApi,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleFieldChange("5k", {
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });
    await act(async () => {
      await result.current.handleSave();
    });

    expect(messageApi.error).toHaveBeenCalledWith(RECORDS_LABELS.saveFail);
    expect(messageApi.error).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("falls back to default rows when initial load fails", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(createJsonResponse({ error: "failed" }, 500));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();

    const { result } = renderHook(() =>
      useRecords({
        apiUrl: "/api/personal-records",
        messageApi,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rows.find((row) => row.distanceKey === "5k")).toMatchObject({
      timeText: "",
      recordDate: null,
    });
    expect(messageApi.error).not.toHaveBeenCalled();
  });
});
