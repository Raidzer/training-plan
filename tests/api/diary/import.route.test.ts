import { beforeEach, describe, expect, it, vi } from "vitest";
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

function createImportRequest(fileBuffer?: ArrayBuffer): Request {
  let file: Blob | null = null;
  if (fileBuffer) {
    file = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  const requestStub = {
    formData: async () => ({
      get: (key: string) => {
        if (key === "file") {
          return file;
        }
        return null;
      },
    }),
  };
  return requestStub as unknown as Request;
}

describe("POST /api/diary/import", () => {
  beforeEach(() => {
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
});
