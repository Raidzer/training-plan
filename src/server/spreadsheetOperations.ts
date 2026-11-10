const MAX_ACTIVE_OPERATIONS = 2;
const MAX_WAITING_OPERATIONS = 20;
const MAX_WAIT_MS = 60_000;
const QUEUE_KEY = Symbol.for("training-plan.spreadsheet-operations");

type WaitingOperation = { start: () => void };
type SpreadsheetQueue = { active: number; waiting: WaitingOperation[] };

const GLOBAL_QUEUE = globalThis as typeof globalThis & { [QUEUE_KEY]?: SpreadsheetQueue };
const QUEUE = (GLOBAL_QUEUE[QUEUE_KEY] ??= { active: 0, waiting: [] });

export class SpreadsheetOperationError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function acquireSlot(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new SpreadsheetOperationError("Запрос отменён", 499));
  }
  if (QUEUE.active < MAX_ACTIVE_OPERATIONS) {
    QUEUE.active += 1;
    return Promise.resolve();
  }
  if (QUEUE.waiting.length >= MAX_WAITING_OPERATIONS) {
    return Promise.reject(
      new SpreadsheetOperationError("Очередь импорта и экспорта заполнена. Повторите позже", 503)
    );
  }

  return new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + MAX_WAIT_MS;
    const cleanup = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
    };
    const rejectWaiting = (error: SpreadsheetOperationError) => {
      const index = QUEUE.waiting.indexOf(waiting);
      if (index === -1) {
        return;
      }
      QUEUE.waiting.splice(index, 1);
      cleanup();
      reject(error);
    };
    const onAbort = () => rejectWaiting(new SpreadsheetOperationError("Запрос отменён", 499));
    const timeoutError = () =>
      new SpreadsheetOperationError(
        "Время ожидания импорта или экспорта истекло. Повторите позже",
        503
      );
    const waiting: WaitingOperation = {
      start() {
        cleanup();
        if (signal.aborted) {
          reject(new SpreadsheetOperationError("Запрос отменён", 499));
          return;
        }
        if (Date.now() >= deadline) {
          reject(timeoutError());
          return;
        }
        QUEUE.active += 1;
        resolve();
      },
    };
    const timeout = setTimeout(() => rejectWaiting(timeoutError()), MAX_WAIT_MS);
    signal.addEventListener("abort", onAbort, { once: true });
    QUEUE.waiting.push(waiting);
  });
}

export async function runSpreadsheetOperation<T>(
  signal: AbortSignal,
  operation: () => Promise<T>
): Promise<T> {
  await acquireSlot(signal);
  try {
    if (signal.aborted) {
      throw new SpreadsheetOperationError("Запрос отменён", 499);
    }
    return await operation();
  } finally {
    QUEUE.active -= 1;
    while (QUEUE.active < MAX_ACTIVE_OPERATIONS && QUEUE.waiting.length > 0) {
      QUEUE.waiting.shift()!.start();
    }
  }
}
