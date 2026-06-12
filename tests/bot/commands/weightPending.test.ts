import { beforeEach, describe, expect, it, vi } from "vitest";

const weightMocks = vi.hoisted(() => ({
  getSubscriptionMock: vi.fn(),
  getRecoveryEntryByDateMock: vi.fn(),
  upsertWeightEntryMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: weightMocks.getSubscriptionMock,
}));

vi.mock("@/server/recoveryEntries", () => ({
  getRecoveryEntryByDate: weightMocks.getRecoveryEntryByDateMock,
}));

vi.mock("@/server/weightEntries", () => ({
  upsertWeightEntry: weightMocks.upsertWeightEntryMock,
}));

import { handleWeightPending } from "@/bot/commands/handlers/textMessage/pending/handleWeight";
import {
  buildBackReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
  REPORT_MAIN_MENU_BUTTON_TEXT,
  REPORT_RECOVERY_BUTTON_TEXT,
  REPORT_WEIGHT_BUTTON_TEXT,
  WEIGHT_CUSTOM_DATE_BUTTON_TEXT,
  WEIGHT_EVENING_BUTTON_TEXT,
  WEIGHT_MORNING_BUTTON_TEXT,
  WEIGHT_TODAY_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearRecoveryDraft,
  clearWeightDraft,
  getPendingInput,
  getRecoveryDraft,
  getWeightDraft,
  setWeightDraft,
} from "@/bot/menu/menuState";

function createContext() {
  return {
    reply: vi.fn(),
  };
}

describe("handleWeightPending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingInput(10);
    clearRecoveryDraft(10);
    clearWeightDraft(10);
    weightMocks.getSubscriptionMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
    });
    weightMocks.getRecoveryEntryByDateMock.mockResolvedValue(null);
  });

  it("должен возвращаться в главное меню из выбора даты", async () => {
    const ctx = createContext();

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "weightDateMenu",
      userId: 20,
    });

    expect(getPendingInput(10)).toBeNull();
    expect(getWeightDraft(10)).toEqual({ date: null, period: null });
    expect(ctx.reply).toHaveBeenCalledWith(
      "Меню управления ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен выбирать сегодняшнюю дату с учетом таймзоны подписки", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T21:30:00.000Z"));
    const ctx = createContext();

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: WEIGHT_TODAY_BUTTON_TEXT,
      pending: "weightDateMenu",
      userId: 20,
    });

    expect(getWeightDraft(10)).toEqual({
      date: "2026-05-11",
      period: null,
    });
    expect(getPendingInput(10)).toBe("weightAction");
    expect(ctx.reply).toHaveBeenCalledWith(
      "Выбери действие.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );

    vi.useRealTimers();
  });

  it("должен переводить пользователя на ввод произвольной даты и валидировать дату", async () => {
    const ctx = createContext();

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: WEIGHT_CUSTOM_DATE_BUTTON_TEXT,
      pending: "weightDateMenu",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightDate");
    expect(ctx.reply).toHaveBeenCalledWith(
      "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025).",
      {
        reply_markup: buildBackReplyKeyboard(),
      }
    );

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: "bad-date",
      pending: "weightDate",
      userId: 20,
    });

    expect(getWeightDraft(10)).toEqual({ date: null, period: null });

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: "11-05-2026",
      pending: "weightDate",
      userId: 20,
    });

    expect(getWeightDraft(10)).toEqual({
      date: "2026-05-11",
      period: null,
    });
    expect(getPendingInput(10)).toBe("weightAction");
  });

  it("должен поднимать recovery draft из выбранной даты и существующей записи", async () => {
    const ctx = createContext();
    setWeightDraft(10, { date: "2026-05-11" });
    weightMocks.getRecoveryEntryByDateMock.mockResolvedValue({
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      sleepHours: "7.5",
    });

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: REPORT_RECOVERY_BUTTON_TEXT,
      pending: "weightAction",
      userId: 20,
    });

    expect(weightMocks.getRecoveryEntryByDateMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2026-05-11",
    });
    expect(getRecoveryDraft(10)).toMatchObject({
      date: "2026-05-11",
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      sleepHours: "07:30",
    });
    expect(getPendingInput(10)).toBe("recoverySelect");
  });

  it("должен выбирать период веса и сохранять валидное значение", async () => {
    const ctx = createContext();
    setWeightDraft(10, { date: "2026-05-11" });

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: REPORT_WEIGHT_BUTTON_TEXT,
      pending: "weightAction",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightPeriod");

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: WEIGHT_MORNING_BUTTON_TEXT,
      pending: "weightPeriod",
      userId: 20,
    });

    expect(getWeightDraft(10)).toEqual({
      date: "2026-05-11",
      period: "morning",
    });
    expect(getPendingInput(10)).toBe("weightValue");

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: "72,4",
      pending: "weightValue",
      userId: 20,
    });

    expect(weightMocks.upsertWeightEntryMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2026-05-11",
      period: "morning",
      weightKg: 72.4,
    });
    expect(getPendingInput(10)).toBeNull();
    expect(getWeightDraft(10)).toEqual({ date: null, period: null });
    expect(ctx.reply).toHaveBeenLastCalledWith(
      "Вес записан: 72.4 кг (утро, 11-05-2026).",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен обрабатывать отсутствующий черновик и неверные значения веса", async () => {
    const ctx = createContext();

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: REPORT_WEIGHT_BUTTON_TEXT,
      pending: "weightAction",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightDateMenu");
    expect(ctx.reply).toHaveBeenLastCalledWith(
      "Сначала выбери дату.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );

    setWeightDraft(10, { date: "2026-05-11", period: "evening" });

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: "0",
      pending: "weightValue",
      userId: 20,
    });

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: "abc",
      pending: "weightValue",
      userId: 20,
    });

    expect(weightMocks.upsertWeightEntryMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenLastCalledWith("Введите вес в кг (например, 72.4).", {
      reply_markup: buildBackReplyKeyboard(),
    });
  });

  it("должен возвращать к выбору даты или главному меню из промежуточных шагов", async () => {
    const ctx = createContext();
    setWeightDraft(10, { date: "2026-05-11" });

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "weightPeriod",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightAction");

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: WEIGHT_EVENING_BUTTON_TEXT,
      pending: "weightPeriod",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightValue");

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "weightValue",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightPeriod");

    await handleWeightPending({
      ctx,
      chatId: 10,
      text: REPORT_MAIN_MENU_BUTTON_TEXT,
      pending: "weightAction",
      userId: 20,
    });

    expect(getPendingInput(10)).toBeNull();
  });
});
