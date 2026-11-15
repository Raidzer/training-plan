export const MAX_SPREADSHEET_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10_000;
export const IMPORT_BATCH_SIZE = 500;

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
