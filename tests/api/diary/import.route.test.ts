import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  expectJsonError,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const { authMock, importDiaryFromWorkbookMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    importDiaryFromWorkbookMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/diaryImports", () => {
  return {
    importDiaryFromWorkbook: importDiaryFromWorkbookMock,
  };
});

import { POST } from "@/app/api/diary/import/route";
import { runSpreadsheetOperation } from "@/server/spreadsheetOperations";
import { MAX_SPREADSHEET_FILE_BYTES } from "@/server/spreadsheetLimits";

function createImportRequest(fileBuffer?: ArrayBuffer): Request {
  const body = new Blob(
    fileBuffer
      ? [
          '--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="diary.xlsx"\r\nContent-Type: application/octet-stream\r\n\r\n',
          fileBuffer,
          "\r\n--test-boundary--\r\n",
        ]
      : ["--test-boundary--\r\n"]
  );
  return new Request("http://localhost/api/diary/import", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test-boundary" },
    body,
  });
}

describe("POST /api/diary/import", () => {
  beforeEach(() => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("File", NodeFile);
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "42" }));
    importDiaryFromWorkbookMock.mockResolvedValue({
      sheetName: "Дневник(2026)",
      parsedRows: 2,
      matchedRows: 2,
      reportsUpserted: 2,
      reportsSkipped: 0,
      weightEntriesUpserted: 3,
      recoveryEntriesUpserted: 1,
      skippedRows: 0,
      errors: [],
      warnings: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(createImportRequest(new ArrayBuffer(8)));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 401 при невалидном id пользователя", async () => {
    authMock.mockResolvedValue(createSession({ id: "0" }));

    const response = await POST(createImportRequest(new ArrayBuffer(8)));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 без файла", async () => {
    const response = await POST(createImportRequest());

    await expectJsonError(response, 400, "Не найден файл в поле file");
  });

  it("должен импортировать файл текущего пользователя", async () => {
    const buffer = new ArrayBuffer(8);

    const response = await POST(createImportRequest(buffer));
    const payload = await expectJsonSuccess<{
      sheetName: string;
      reportsUpserted: number;
      warnings: unknown[];
    }>(response, 200);

    expect(payload).toMatchObject({
      sheetName: "Дневник(2026)",
      reportsUpserted: 2,
      warnings: [],
    });
    expect(importDiaryFromWorkbookMock).toHaveBeenCalledWith({
      userId: 42,
      buffer,
    });
  });

  it("должен возвращать ошибку импорта", async () => {
    importDiaryFromWorkbookMock.mockRejectedValue(new Error("Не найден лист дневника"));

    const response = await POST(createImportRequest(new ArrayBuffer(8)));
    const payload = await readJsonResponse<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Не найден лист дневника");
  });

  it("возвращает понятную ошибку при таймауте блокировки", async () => {
    importDiaryFromWorkbookMock.mockRejectedValueOnce(
      new Error("Failed query", {
        cause: { code: "55P03" },
      })
    );
    const response = await POST(createImportRequest(new ArrayBuffer(8)));
    await expectJsonError(response, 503, "Сервер занят. Повторите импорт позже");
  });

  it("возвращает 413 без разбора Excel при превышении размера файла", async () => {
    const response = await POST(
      createImportRequest(new ArrayBuffer(MAX_SPREADSHEET_FILE_BYTES + 1))
    );

    await expectJsonError(response, 413, "Файл слишком большой. Максимальный размер — 10 МиБ");
    expect(importDiaryFromWorkbookMock).not.toHaveBeenCalled();
  });

  it("при заполненной общей очереди не читает тело запроса", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const operations = Array.from({ length: 22 }, () =>
      runSpreadsheetOperation(new AbortController().signal, () => gate)
    );
    const request = createImportRequest(new ArrayBuffer(8));
    const readBody = vi.spyOn(request.body!, "getReader");
    try {
      const response = await POST(request);
      await expectJsonError(response, 503, "Очередь импорта и экспорта заполнена. Повторите позже");
      expect(readBody).not.toHaveBeenCalled();
      expect(importDiaryFromWorkbookMock).not.toHaveBeenCalled();
    } finally {
      release();
      await Promise.all(operations);
    }
  });
});
