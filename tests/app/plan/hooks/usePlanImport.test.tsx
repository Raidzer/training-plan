import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLAN_TEXT } from "@/app/(protected)/plan/PlanClient/constants/planText";
import { usePlanImport } from "@/app/(protected)/plan/PlanClient/hooks/usePlanImport";
import type { PlanImportFile } from "@/app/(protected)/plan/PlanClient/types/planTypes";
import type { MessageInstance } from "antd/es/message/interface";

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
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

function createUploadFile(): PlanImportFile {
  return {
    uid: "file-1",
    name: "plan.xlsx",
    originFileObj: new File(["plan"], "plan.xlsx"),
  } as PlanImportFile;
}

describe("usePlanImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("requires selected file before upload", async () => {
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.fileRequired);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("keeps only last selected file and allows removing it", () => {
    const msgApi = createMessageApi();
    const firstFile = createUploadFile();
    const secondFile = {
      ...createUploadFile(),
      uid: "file-2",
      name: "next-plan.xlsx",
    };
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([firstFile, secondFile]);
    });

    expect(result.current.fileList).toEqual([secondFile]);

    let removed = false;
    act(() => {
      removed = result.current.handleFileRemove();
    });

    expect(removed).toBe(true);
    expect(result.current.fileList).toEqual([]);
  });

  it("uploads file and stores import result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        importId: 7,
        inserted: 12,
        skipped: 0,
        errors: [],
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    const uploadRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock).toHaveBeenCalledWith("/api/plans/import", expect.any(Object));
    expect(uploadRequest.method).toBe("POST");
    expect(uploadRequest.body).toBeInstanceOf(FormData);
    expect((uploadRequest.body as FormData).get("file")).toBeInstanceOf(File);
    expect(result.current.result).toEqual({
      importId: 7,
      inserted: 12,
      skipped: 0,
      errors: [],
    });
    expect(msgApi.success).toHaveBeenCalledWith(PLAN_TEXT.messages.importSuccess(12));

    act(() => {
      result.current.handleFileChange([
        {
          ...createUploadFile(),
          uid: "file-2",
          name: "updated-plan.xlsx",
        },
      ]);
    });

    expect(result.current.result).toBeNull();
  });

  it("shows warning when import finishes with row errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        importId: 8,
        inserted: 3,
        skipped: 2,
        errors: [{ row: 4, message: "empty task" }],
        warnings: [{ row: 5, message: "date already exists" }],
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(msgApi.warning).toHaveBeenCalledWith(PLAN_TEXT.messages.importWithErrors(3, 2));
  });

  it("stores failed import details from server response", async () => {
    const failedResult = {
      error: "Не найдены колонки Дата/Задание в первой строке.",
      details: ["Не найдены колонки: Дата."],
      foundHeaders: ["1: Foo", "2: Bar"],
    };
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(failedResult, 400));
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual(failedResult);
    expect(msgApi.error).toHaveBeenCalledWith(failedResult.error);

    act(() => {
      result.current.handleFileRemove();
    });

    expect(result.current.result).toBeNull();
  });

  it("shows the request error inline when the network request fails", async () => {
    const requestError = new Error("network unavailable");
    const fetchMock = vi.fn().mockRejectedValue(requestError);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual({
      error: PLAN_TEXT.messages.importRequestError,
    });
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.importRequestError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(requestError);

    consoleErrorSpy.mockRestore();
  });

  it("shows a generic inline error when the server response is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("service unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual({
      error: PLAN_TEXT.messages.importFailed,
    });
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.importFailed);
  });

  it("prevents a repeated request while the current upload is in progress", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pendingResponse);
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();
    const { result } = renderHook(() => usePlanImport({ msgApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    let firstUpload = Promise.resolve();
    act(() => {
      firstUpload = result.current.handleUpload();
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest(
        createJsonResponse({
          importId: 10,
          inserted: 4,
          skipped: 0,
          errors: [],
        })
      );
      await firstUpload;
    });

    expect(result.current.loading).toBe(false);
  });
});
