import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertExportRangeLimit,
  assertImportRowLimit,
  readSpreadsheetFile,
} from "@/server/spreadsheetLimits";

const FILE_LIMIT = 10 * 1024 * 1024;
const BODY_LIMIT = FILE_LIMIT + 64 * 1024;
const CONTENT_TYPE = "multipart/form-data; boundary=spreadsheet-test";

function createFileRequest(size: number, headers?: HeadersInit) {
  const body = new Blob([
    '--spreadsheet-test\r\nContent-Disposition: form-data; name="file"; filename="data.xlsx"\r\nContent-Type: application/octet-stream\r\n\r\n',
    new Uint8Array(size),
    "\r\n--spreadsheet-test--\r\n",
  ]);
  return new Request("http://localhost/api/import", {
    method: "POST",
    headers: { "content-type": CONTENT_TYPE, ...headers },
    body,
  });
}

beforeEach(() => {
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("File", NodeFile);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readSpreadsheetFile", () => {
  it("принимает файл ровно 10 МиБ вместе с multipart overhead без Content-Length", async () => {
    const request = createFileRequest(FILE_LIMIT);
    expect(request.headers.has("content-length")).toBe(false);

    const file = await readSpreadsheetFile(request);

    expect(file.size).toBe(10_485_760);
    expect(file).toBeInstanceOf(NodeBlob);
  });

  it("отклоняет файл больше 10 МиБ даже при допустимом размере multipart тела", async () => {
    await expect(readSpreadsheetFile(createFileRequest(FILE_LIMIT + 1))).rejects.toMatchObject({
      status: 413,
    });
  });

  it.each([undefined, "1"])(
    "прекращает чтение фактического тела больше лимита при Content-Length=%s",
    async (contentLength) => {
      let cancelled = false;
      const chunks = [new Uint8Array(BODY_LIMIT), new Uint8Array(1)];
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          const chunk = chunks.shift();
          if (chunk) {
            controller.enqueue(chunk);
          }
        },
        cancel() {
          cancelled = true;
        },
      });
      const headers = new Headers({ "content-type": CONTENT_TYPE });
      if (contentLength) {
        headers.set("content-length", contentLength);
      }
      const request = new Request("http://localhost/api/import", {
        method: "POST",
        headers,
        body: stream,
        duplex: "half",
      } as RequestInit);

      await expect(readSpreadsheetFile(request)).rejects.toMatchObject({ status: 413 });
      expect(cancelled).toBe(true);
    }
  );

  it("отклоняет заведомо большой Content-Length до чтения тела", async () => {
    const request = createFileRequest(1, { "content-length": String(BODY_LIMIT + 1) });

    await expect(readSpreadsheetFile(request)).rejects.toMatchObject({ status: 413 });
    expect(request.bodyUsed).toBe(false);
  });

  it.each([
    { body: "broken", type: CONTENT_TYPE },
    { body: "plain text", type: "text/plain" },
    {
      body: '--spreadsheet-test\r\nContent-Disposition: form-data; name="file"\r\n\r\ntext\r\n--spreadsheet-test--\r\n',
      type: CONTENT_TYPE,
    },
    { body: "--spreadsheet-test--\r\n", type: CONTENT_TYPE },
  ])("возвращает 400 для повреждённого multipart или отсутствующего файла: $body", async (data) => {
    const request = new Request("http://localhost/api/import", {
      method: "POST",
      headers: { "content-type": data.type },
      body: data.body,
    });

    await expect(readSpreadsheetFile(request)).rejects.toMatchObject({ status: 400 });
  });

  it("возвращает 400 для отсутствующего тела", async () => {
    await expect(
      readSpreadsheetFile(new Request("http://localhost/api/import", { method: "POST" }))
    ).rejects.toMatchObject({ status: 400 });
  });

  it("возвращает понятную ошибку при обрыве потока", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("connection reset"));
      },
    });
    const request = new Request("http://localhost/api/import", {
      method: "POST",
      headers: { "content-type": CONTENT_TYPE },
      body: stream,
      duplex: "half",
    } as RequestInit);

    await expect(readSpreadsheetFile(request)).rejects.toMatchObject({ status: 400 });
  });
});

describe("assertImportRowLimit", () => {
  it("принимает 10 000 строк, отклоняет 10 001 до записи", () => {
    expect(() => assertImportRowLimit(10_000)).not.toThrow();
    expect(() => assertImportRowLimit(10_001)).toThrow(expect.objectContaining({ status: 400 }));
  });
});

describe("assertExportRangeLimit", () => {
  it.each([
    ["2000-01-01", "2019-12-31"],
    ["2000-02-29", "2020-02-28"],
    ["2080-02-29", "2100-02-27"],
    ["2026-11-09", "2026-11-09"],
  ])("принимает включительный диапазон %s — %s", (from, to) => {
    expect(() => assertExportRangeLimit(from, to)).not.toThrow();
  });

  it.each([
    ["2000-01-01", "2020-01-01"],
    ["2000-02-29", "2020-02-29"],
    ["2080-02-29", "2100-02-28"],
    ["2000-01-01", "2050-01-01"],
  ])("отклоняет диапазон больше 20 календарных лет %s — %s", (from, to) => {
    expect(() => assertExportRangeLimit(from, to)).toThrow(
      expect.objectContaining({ status: 400 })
    );
  });

  it.each([
    ["2025-02-29", "2025-03-01"],
    ["2024-02-30", "2024-03-01"],
    ["2024-13-01", "2025-01-01"],
    ["2024-01-01", "2024-04-31"],
    ["2024-1-01", "2024-02-01"],
    ["0000-01-01", "0001-01-01"],
    ["2026-11-09", "2026-11-08"],
    ["", "2026-11-09"],
  ])("отклоняет нереальные даты или обратный диапазон %s — %s", (from, to) => {
    expect(() => assertExportRangeLimit(from, to)).toThrow(
      expect.objectContaining({ status: 400 })
    );
  });
});
