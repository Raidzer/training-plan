import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RECORDS_LABELS } from "@/app/(protected)/profile/records/RecordsClient/constants/recordsConstants";
import { useRecords } from "@/app/(protected)/profile/records/RecordsClient/hooks/useRecords";
import type { ApiRecord } from "@/app/(protected)/profile/records/RecordsClient/types/recordsTypes";
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

function createDeferredResponse() {
  let resolveResponse!: (response: Response) => void;
  const promise = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });

  return {
    promise,
    resolve: resolveResponse,
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
    expect(result.current.loadError).toBe(false);
    expect(result.current.hasChanges).toBe(false);
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

    let saveResult;
    await act(async () => {
      saveResult = await result.current.handleSave();
    });

    expect(saveResult).toEqual({ status: "invalid", invalidDistanceKey: "5k" });
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

  it("clears only the validation errors related to changed fields", async () => {
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

    expect(result.current.errors["5k"]).toEqual({ date: true });

    act(() => {
      result.current.handleFieldChange("5k", {
        recordDate: dayjs("2026-05-10"),
      });
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.hasChanges).toBe(true);
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
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saveError).toBe(false);
  });

  it("keeps edits and shows save error for malformed response and network error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ records: [] }))
      .mockResolvedValueOnce(createJsonResponse({ records: "invalid" }))
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
    expect(result.current.saveError).toBe(true);
    expect(result.current.hasChanges).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("blocks editing after load failure and restores records on retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ error: "failed" }, 500))
      .mockResolvedValueOnce(createJsonResponse({ records: [createApiRecord()] }));
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

    expect(result.current.loadError).toBe(true);
    expect(result.current.rows.find((row) => row.distanceKey === "5k")).toMatchObject({
      timeText: "",
      recordDate: null,
    });

    let blockedResult;
    await act(async () => {
      blockedResult = await result.current.handleSave();
    });
    expect(blockedResult).toEqual({ status: "blocked" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(result.current.loadError).toBe(false);
    expect(result.current.rows.find((row) => row.distanceKey === "5k")?.timeText).toBe("00:18:30");
    expect(messageApi.error).not.toHaveBeenCalled();
  });

  it("rejects a malformed successful load response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        records: [{ ...createApiRecord(), recordDate: null }],
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

    expect(result.current.loadError).toBe(true);
    expect(result.current.rows.every((row) => row.timeText === "")).toBe(true);
  });

  it("clears a record draft and its validation errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ records: [createApiRecord()] }));
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
      result.current.handleFieldChange("5k", { timeText: "bad-time" });
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(result.current.errors["5k"]?.time).toBe(true);

    act(() => {
      result.current.handleClearRecord("5k");
    });

    expect(result.current.rows.find((row) => row.distanceKey === "5k")).toMatchObject({
      timeText: "",
      recordDate: null,
      protocolUrl: "",
      raceName: "",
      raceCity: "",
    });
    expect(result.current.errors["5k"]).toBeUndefined();
    expect(result.current.hasChanges).toBe(true);
  });

  it("blocks duplicate save requests until the active request completes", async () => {
    const deferredResponse = createDeferredResponse();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ records: [] }))
      .mockImplementationOnce(() => deferredResponse.promise);
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
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
      });
    });

    let activeSave!: ReturnType<typeof result.current.handleSave>;
    act(() => {
      activeSave = result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.saving).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    let duplicateResult;
    await act(async () => {
      duplicateResult = await result.current.handleSave();
    });

    expect(duplicateResult).toEqual({ status: "blocked" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    deferredResponse.resolve(createJsonResponse({ records: [createApiRecord()] }));
    await act(async () => {
      await activeSave;
    });

    expect(result.current.saving).toBe(false);
    expect(messageApi.success).toHaveBeenCalledWith(RECORDS_LABELS.saveOk);
  });
});
