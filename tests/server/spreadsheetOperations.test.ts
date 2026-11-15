import { afterEach, describe, expect, it, vi } from "vitest";
import { runSpreadsheetOperation } from "@/server/spreadsheetOperations";

const controllers: AbortController[] = [];
const operations: Promise<unknown>[] = [];
const releases: (() => void)[] = [];

function createGate() {
  const gate = Promise.withResolvers<void>();
  releases.push(gate.resolve);
  return gate;
}

function schedule<T>(operation: () => Promise<T>, controller = new AbortController()) {
  controllers.push(controller);
  const promise = runSpreadsheetOperation(controller.signal, operation);
  operations.push(promise);
  void promise.catch(() => undefined);
  return promise;
}

afterEach(async () => {
  controllers.splice(0).forEach((controller) => controller.abort());
  releases.splice(0).forEach((release) => release());
  await Promise.allSettled(operations.splice(0));
  vi.useRealTimers();
});

describe("runSpreadsheetOperation", () => {
  it("выполняет не более двух операций и запускает ожидающие в порядке FIFO", async () => {
    const gates = [createGate(), createGate(), createGate(), createGate()];
    const started: number[] = [];
    const pending = gates.map((gate, index) =>
      schedule(async () => {
        started.push(index);
        await gate.promise;
        return index;
      })
    );
    await Promise.resolve();
    expect(started).toEqual([0, 1]);

    gates[1].resolve();
    await pending[1];
    expect(started).toEqual([0, 1, 2]);

    gates[0].resolve();
    await pending[0];
    expect(started).toEqual([0, 1, 2, 3]);
    gates[2].resolve();
    gates[3].resolve();
    await expect(Promise.all(pending)).resolves.toEqual([0, 1, 2, 3]);
  });

  it("при двух активных и двадцати ожидающих сразу отклоняет следующий запрос", async () => {
    const gate = createGate();
    const started: number[] = [];
    for (let index = 0; index < 22; index += 1) {
      schedule(async () => {
        started.push(index);
        await gate.promise;
      });
    }

    await expect(schedule(async () => started.push(22))).rejects.toMatchObject({ status: 503 });
    expect(started).toEqual([0, 1]);
  });

  it("удаляет отменённый ожидающий запрос и освобождает место в очереди", async () => {
    const gate = createGate();
    schedule(() => gate.promise);
    schedule(() => gate.promise);
    const cancelledController = new AbortController();
    let cancelledStarted = false;
    const cancelled = schedule(async () => {
      cancelledStarted = true;
    }, cancelledController);
    for (let index = 0; index < 19; index += 1) {
      schedule(() => gate.promise);
    }

    cancelledController.abort();
    await expect(cancelled).rejects.toMatchObject({ status: 499 });
    const replacement = schedule(async () => "replacement");
    gate.resolve();
    await expect(replacement).resolves.toBe("replacement");
    expect(cancelledStarted).toBe(false);
  });

  it("отклоняет уже отменённый запрос, не занимая активное место", async () => {
    const controller = new AbortController();
    controller.abort();
    let started = false;

    await expect(
      schedule(async () => {
        started = true;
      }, controller)
    ).rejects.toMatchObject({ status: 499 });
    expect(started).toBe(false);
    await expect(schedule(async () => "next")).resolves.toBe("next");
  });

  it("отклоняет ожидающую операцию через 60 секунд без ограничения активной", async () => {
    vi.useFakeTimers();
    const gate = createGate();
    const first = schedule(() => gate.promise);
    schedule(() => gate.promise);
    let started = false;
    let settled = false;
    const waiting = schedule(async () => {
      started = true;
    });
    void waiting.catch(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(59_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(waiting).rejects.toMatchObject({ status: 503 });
    expect(started).toBe(false);

    let replacementStarted = false;
    const replacement = schedule(async () => {
      replacementStarted = true;
    });
    await Promise.resolve();
    expect(replacementStarted).toBe(false);
    gate.resolve();
    await first;
    await replacement;
    expect(replacementStarted).toBe(true);
  });

  it("повторно проверяет deadline перед запуском при задержке callback таймера", async () => {
    vi.useFakeTimers();
    const gate = createGate();
    const first = schedule(() => gate.promise);
    schedule(() => gate.promise);
    let started = false;
    const waiting = schedule(async () => {
      started = true;
    });

    vi.setSystemTime(Date.now() + 60_000);
    gate.resolve();
    await first;
    await expect(waiting).rejects.toMatchObject({ status: 503 });
    expect(started).toBe(false);
  });

  it("не освобождает место активной операции при отмене её HTTP-запроса", async () => {
    const firstGate = createGate();
    const secondGate = createGate();
    const controller = new AbortController();
    const first = schedule(() => firstGate.promise, controller);
    schedule(() => secondGate.promise);
    let waitingStarted = false;
    const waiting = schedule(async () => {
      waitingStarted = true;
    });
    await Promise.resolve();

    controller.abort();
    await Promise.resolve();
    expect(waitingStarted).toBe(false);
    firstGate.resolve();
    await first;
    await waiting;
    expect(waitingStarted).toBe(true);
  });

  it.each([true, false])("освобождает место после ошибки (синхронная: %s)", async (sync) => {
    const gate = createGate();
    schedule(() => gate.promise);
    const failure = new Error("operation failed");
    const failing = schedule(() => {
      if (sync) {
        throw failure;
      }
      return Promise.reject(failure);
    });
    const waiting = schedule(async () => "recovered");

    await expect(failing).rejects.toBe(failure);
    await expect(waiting).resolves.toBe("recovered");
  });

  it("разделяет предел между отдельными экземплярами серверного модуля", async () => {
    const gate = createGate();
    const first = schedule(() => gate.promise);
    schedule(() => gate.promise);
    vi.resetModules();
    const otherModule = await import("@/server/spreadsheetOperations");
    const controller = new AbortController();
    controllers.push(controller);
    let started = false;
    const waiting = otherModule.runSpreadsheetOperation(controller.signal, async () => {
      started = true;
      return "shared";
    });
    operations.push(waiting);
    void waiting.catch(() => undefined);
    await Promise.resolve();
    expect(started).toBe(false);

    gate.resolve();
    await first;
    await expect(waiting).resolves.toBe("shared");
  });
});
