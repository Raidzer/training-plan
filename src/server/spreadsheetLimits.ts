import { inflateRawSync } from "node:zlib";

export const MAX_SPREADSHEET_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10_000;
export const IMPORT_BATCH_SIZE = 500;
const MAX_SPREADSHEET_ZIP_ENTRIES = 256;
export const MAX_SPREADSHEET_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
export const MAX_SPREADSHEET_PART_BYTES = 16 * 1024 * 1024;

const MAX_MULTIPART_BODY_BYTES = MAX_SPREADSHEET_FILE_BYTES + 64 * 1024;
const FILE_SIZE_ERROR = "Файл слишком большой. Максимальный размер — 10 МиБ";

export class SpreadsheetLimitError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

const invalidArchive = (): never => {
  throw new SpreadsheetLimitError("Не удалось прочитать Excel-файл. Проверьте формат XLSX", 400);
};

export function assertSpreadsheetArchiveLimits(bytes: Buffer): void {
  if (bytes.length > MAX_SPREADSHEET_FILE_BYTES) {
    throw new SpreadsheetLimitError(FILE_SIZE_ERROR, 413);
  }
  const footer = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (footer < 0 || footer + 22 > bytes.length) {
    invalidArchive();
  }

  const entryCount = bytes.readUInt16LE(footer + 10);
  const directorySize = bytes.readUInt32LE(footer + 12);
  const directoryStart = bytes.readUInt32LE(footer + 16);
  if (
    bytes.readUInt32LE(footer + 4) !== 0 ||
    bytes.readUInt16LE(footer + 8) !== entryCount ||
    entryCount === 0xffff ||
    directoryStart + directorySize !== footer ||
    footer + 22 + bytes.readUInt16LE(footer + 20) !== bytes.length
  ) {
    invalidArchive();
  }
  if (entryCount > MAX_SPREADSHEET_ZIP_ENTRIES) {
    throw new SpreadsheetLimitError("Книга содержит слишком много частей для импорта", 413);
  }

  const parts: Array<{ local: number; start: number; end: number; size: number; method: number }> =
    [];
  let offset = directoryStart;
  let totalSize = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > footer || bytes.readUInt32LE(offset) !== 0x02014b50) {
      invalidArchive();
    }

    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const size = bytes.readUInt32LE(offset + 24);
    const local = bytes.readUInt32LE(offset + 42);
    const disk = bytes.readUInt16LE(offset + 34);
    offset +=
      46 +
      bytes.readUInt16LE(offset + 28) +
      bytes.readUInt16LE(offset + 30) +
      bytes.readUInt16LE(offset + 32);
    if (offset > footer || disk !== 0 || flags & 1 || (method !== 0 && method !== 8)) {
      invalidArchive();
    }
    totalSize += size;
    if (size > MAX_SPREADSHEET_PART_BYTES || totalSize > MAX_SPREADSHEET_UNCOMPRESSED_BYTES) {
      throw new SpreadsheetLimitError("Распакованный размер книги превышает допустимый лимит", 413);
    }
    if (
      local + 30 > directoryStart ||
      bytes.readUInt32LE(local) !== 0x04034b50 ||
      bytes.readUInt16LE(local + 6) !== flags ||
      bytes.readUInt16LE(local + 8) !== method
    ) {
      invalidArchive();
    }
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const end = start + compressedSize;
    if (end > directoryStart || (method === 0 && compressedSize !== size)) {
      invalidArchive();
    }
    parts.push({ local, start, end, method, size });
  }
  if (offset !== footer) invalidArchive();

  let previousEnd = 0;
  for (const part of parts.sort((left, right) => left.local - right.local)) {
    if (part.local < previousEnd) invalidArchive();
    previousEnd = part.end;
    if (part.method === 8) {
      try {
        const result = inflateRawSync(bytes.subarray(part.start, part.end), {
          info: true,
          maxOutputLength: Math.max(1, part.size),
        }) as unknown as { buffer: Buffer; engine: { bytesWritten: number } };
        if (
          result.buffer.length !== part.size ||
          result.engine.bytesWritten !== part.end - part.start
        ) {
          invalidArchive();
        }
      } catch {
        invalidArchive();
      }
    }
  }
}

export async function readSpreadsheetFile(req: Request): Promise<Blob> {
  if (Number(req.headers.get("content-length")) > MAX_MULTIPART_BODY_BYTES) {
    throw new SpreadsheetLimitError(FILE_SIZE_ERROR, 413);
  }

  try {
    if (!req.body) {
      throw new SpreadsheetLimitError("Не найден файл в поле file", 400);
    }
    const reader = req.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        size += value.byteLength;
        if (size > MAX_MULTIPART_BODY_BYTES) {
          void reader.cancel().catch(() => undefined);
          throw new SpreadsheetLimitError(FILE_SIZE_ERROR, 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const response = new Response(new Blob(chunks), {
      headers: { "content-type": req.headers.get("content-type") ?? "" },
    });
    const formData = await response.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      throw new SpreadsheetLimitError("Не найден файл в поле file", 400);
    }
    if (file.size > MAX_SPREADSHEET_FILE_BYTES) {
      throw new SpreadsheetLimitError(FILE_SIZE_ERROR, 413);
    }
    return file;
  } catch (error) {
    if (error instanceof SpreadsheetLimitError) {
      throw error;
    }
    throw new SpreadsheetLimitError("Не удалось прочитать файл. Проверьте формат запроса", 400);
  }
}

export function assertImportRowLimit(count: number): void {
  if (count > MAX_IMPORT_ROWS) {
    throw new SpreadsheetLimitError(
      "Файл содержит больше 10 000 строк. Разделите его на части",
      400
    );
  }
}

function parseExportDate(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith("0000-") ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new SpreadsheetLimitError("Укажите корректные даты периода экспорта", 400);
  }
  return date;
}

export function assertExportRangeLimit(from: string, to: string): void {
  const start = parseExportDate(from);
  const end = parseExportDate(to);
  if (start > end) {
    throw new SpreadsheetLimitError("Начало периода экспорта не может быть позже окончания", 400);
  }
  const limit = new Date(start);
  limit.setUTCFullYear(start.getUTCFullYear() + 20);
  if (limit.getUTCMonth() !== start.getUTCMonth()) {
    limit.setUTCDate(0);
  }
  if (end >= limit) {
    throw new SpreadsheetLimitError(
      "Период экспорта превышает 20 лет. Выберите меньший период",
      400
    );
  }
}
