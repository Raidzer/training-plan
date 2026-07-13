import { act, renderHook } from "@testing-library/react";
import type { MessageInstance } from "antd/es/message/interface";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DIARY_IMPORT_TEXT } from "@/app/(protected)/diary/import/DiaryImportClient/constants/diaryImportConstants";
import { useDiaryImport } from "@/app/(protected)/diary/import/DiaryImportClient/hooks/useDiaryImport";
import type { DiaryImportFile } from "@/app/(protected)/diary/import/DiaryImportClient/types/diaryImportTypes";

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

function createUploadFile(): DiaryImportFile {
  return {
    uid: "file-1",
    name: "diary.xlsx",
    originFileObj: new File(["diary"], "diary.xlsx"),
  } as DiaryImportFile;
}

const SUCCESS_RESULT = {
  sheetName: "Дневник(2026)",
  parsedRows: 3,
  matchedRows: 3,
  reportsUpserted: 2,
  reportsSkipped: 0,
  weightEntriesUpserted: 2,
  recoveryEntriesUpserted: 1,
  skippedRows: 0,
  errors: [],
  warnings: [],
};

describe("useDiaryImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("требует выбрать файл перед импортом", async () => {
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(messageApi.error).toHaveBeenCalledWith(DIARY_IMPORT_TEXT.messages.fileRequired);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.fileError).toBe(DIARY_IMPORT_TEXT.messages.fileRequired);
  });

  it("оставляет последний выбранный файл и позволяет удалить его", () => {
    const messageApi = createMessageApi();
    const firstFile = createUploadFile();
    const secondFile = {
      ...createUploadFile(),
      uid: "file-2",
      name: "next-diary.xlsx",
    };
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

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
    expect(result.current.fileError).toBeNull();
  });

  it("отправляет файл, сохраняет результат и очищает его при замене файла", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(SUCCESS_RESULT));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    const uploadRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock).toHaveBeenCalledWith("/api/diary/import", expect.any(Object));
    expect(uploadRequest.method).toBe("POST");
    expect(uploadRequest.body).toBeInstanceOf(FormData);
    expect((uploadRequest.body as FormData).get("file")).toBeInstanceOf(File);
    expect(result.current.result).toEqual(SUCCESS_RESULT);
    expect(messageApi.success).toHaveBeenCalledWith(
      DIARY_IMPORT_TEXT.messages.importSuccess(SUCCESS_RESULT.reportsUpserted)
    );

    act(() => {
      result.current.handleFileChange([
        {
          ...createUploadFile(),
          uid: "file-2",
          name: "updated-diary.xlsx",
        },
      ]);
    });

    expect(result.current.result).toBeNull();

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("показывает предупреждение при частичном импорте", async () => {
    const partialResult = {
      ...SUCCESS_RESULT,
      reportsUpserted: 1,
      skippedRows: 2,
      errors: [{ row: 4, message: "Некорректная дата" }],
      warnings: [{ row: 5, message: "Тренировка не найдена" }],
    };
    global.fetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse(partialResult)) as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(messageApi.warning).toHaveBeenCalledWith(
      DIARY_IMPORT_TEXT.messages.importWithWarnings(1, 2)
    );
    expect(result.current.result).toEqual(partialResult);
  });

  it("показывает предупреждение для листа без записей", async () => {
    const emptyResult = {
      ...SUCCESS_RESULT,
      parsedRows: 0,
      matchedRows: 0,
      reportsUpserted: 0,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
    };
    global.fetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse(emptyResult)) as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual(emptyResult);
    expect(messageApi.warning).toHaveBeenCalledWith(DIARY_IMPORT_TEXT.messages.importEmpty);
    expect(messageApi.success).not.toHaveBeenCalled();
  });

  it("сохраняет ошибку сервера в интерфейсе и очищает её при удалении файла", async () => {
    const failedResult = { error: "Не найден лист дневника" };
    global.fetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse(failedResult, 400)) as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual(failedResult);
    expect(messageApi.error).toHaveBeenCalledWith(failedResult.error);

    act(() => {
      result.current.handleFileRemove();
    });

    expect(result.current.result).toBeNull();
  });

  it("показывает сетевую ошибку в интерфейсе", async () => {
    const requestError = new Error("network unavailable");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    global.fetch = vi.fn().mockRejectedValue(requestError) as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual({
      error: DIARY_IMPORT_TEXT.messages.importRequestError,
    });
    expect(messageApi.error).toHaveBeenCalledWith(DIARY_IMPORT_TEXT.messages.importRequestError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(requestError);

    consoleErrorSpy.mockRestore();
  });

  it("показывает общую ошибку для ответа без JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("service unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      })
    ) as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

    act(() => {
      result.current.handleFileChange([createUploadFile()]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.result).toEqual({
      error: DIARY_IMPORT_TEXT.messages.importFailed,
    });
    expect(messageApi.error).toHaveBeenCalledWith(DIARY_IMPORT_TEXT.messages.importFailed);
  });

  it("не отправляет повторный запрос, пока текущая загрузка не завершена", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pendingResponse);
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useDiaryImport({ messageApi }));

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
      resolveRequest(createJsonResponse(SUCCESS_RESULT));
      await firstUpload;
    });

    expect(result.current.loading).toBe(false);
  });
});
