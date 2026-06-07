import { beforeEach, describe, expect, it } from "vitest";

import {
  clearPendingInput,
  clearRecoveryDraft,
  clearWeightDraft,
  getPendingInput,
  getRecoveryDraft,
  getWeightDraft,
  setPendingInput,
  setRecoveryDraft,
  setWeightDraft,
} from "@/bot/menu/menuState";

describe("menuState", () => {
  beforeEach(() => {
    clearPendingInput(10);
    clearWeightDraft(10);
    clearRecoveryDraft(10);
  });

  it("должен хранить и очищать pending input", () => {
    expect(getPendingInput(10)).toBeNull();

    setPendingInput(10, "dateMenu");

    expect(getPendingInput(10)).toBe("dateMenu");

    clearPendingInput(10);

    expect(getPendingInput(10)).toBeNull();
  });

  it("должен частично обновлять черновик веса", () => {
    expect(getWeightDraft(10)).toEqual({ date: null, period: null });

    setWeightDraft(10, { date: "2026-05-10" });
    setWeightDraft(10, { period: "morning" });

    expect(getWeightDraft(10)).toEqual({
      date: "2026-05-10",
      period: "morning",
    });

    clearWeightDraft(10);

    expect(getWeightDraft(10)).toEqual({ date: null, period: null });
  });

  it("должен частично обновлять черновик восстановления", () => {
    expect(getRecoveryDraft(10)).toEqual({
      date: null,
      hasBath: false,
      hasMfr: false,
      hasMassage: false,
      sleepHours: "",
    });

    setRecoveryDraft(10, { date: "2026-05-10", hasBath: true });
    setRecoveryDraft(10, { hasMfr: true, sleepHours: "07:30" });

    expect(getRecoveryDraft(10)).toEqual({
      date: "2026-05-10",
      hasBath: true,
      hasMfr: true,
      hasMassage: false,
      sleepHours: "07:30",
    });

    clearRecoveryDraft(10);

    expect(getRecoveryDraft(10).date).toBeNull();
  });
});
