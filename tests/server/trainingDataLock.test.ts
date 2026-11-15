import { describe, expect, it } from "vitest";
import * as trainingDataLock from "@/server/trainingDataLock";

describe("isTrainingDataBusyError", () => {
  it.each([
    { code: "55P03" },
    new Error("Failed query", { cause: { code: "55P03" } }),
    new Error("timeout exceeded when trying to connect"),
    new Error("Connection terminated due to connection timeout"),
  ])("распознаёт timeout блокировки или пула: %s", (error) => {
    expect(trainingDataLock.isTrainingDataBusyError(error)).toBe(true);
  });

  it.each([null, undefined, "55P03", new Error("query failed"), { code: "23505" }])(
    "не маскирует прочие ошибки: %s",
    (error) => {
      expect(trainingDataLock.isTrainingDataBusyError(error)).toBe(false);
    }
  );

  it("останавливается на циклическом cause", () => {
    const error: { cause?: unknown } = {};
    error.cause = error;
    expect(trainingDataLock.isTrainingDataBusyError(error)).toBe(false);
  });
});
