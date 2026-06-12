import { beforeEach, describe, expect, it, vi } from "vitest";

const recoveryMocks = vi.hoisted(() => ({
  getSubscriptionMock: vi.fn(),
  upsertRecoveryEntryMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: recoveryMocks.getSubscriptionMock,
}));

vi.mock("@/server/recoveryEntries", () => ({
  upsertRecoveryEntry: recoveryMocks.upsertRecoveryEntryMock,
}));

import { handleRecoveryPending } from "@/bot/commands/handlers/textMessage/pending/handleRecovery";
import {
  buildRecoverySleepReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
  RECOVERY_BATH_LABEL,
  RECOVERY_CLEAR_SLEEP_BUTTON_TEXT,
  RECOVERY_MASSAGE_LABEL,
  RECOVERY_MFR_LABEL,
  RECOVERY_SAVE_BUTTON_TEXT,
  RECOVERY_SLEEP_LABEL,
  REPORT_MAIN_MENU_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  clearRecoveryDraft,
  clearWeightDraft,
  getPendingInput,
  getRecoveryDraft,
  setPendingInput,
  setRecoveryDraft,
} from "@/bot/menu/menuState";

function createContext() {
  return {
    reply: vi.fn(),
  };
}

describe("handleRecoveryPending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingInput(10);
    clearRecoveryDraft(10);
    clearWeightDraft(10);
    recoveryMocks.getSubscriptionMock.mockResolvedValue({ enabled: true });
  });

  it("должен требовать дату перед заполнением восстановления", async () => {
    const ctx = createContext();

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: RECOVERY_SAVE_BUTTON_TEXT,
      pending: "recoverySelect",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightDateMenu");
    expect(ctx.reply).toHaveBeenCalledWith(
      "Сначала выбери дату.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен переключать отметки восстановления и сохранять запись", async () => {
    const ctx = createContext();
    setRecoveryDraft(10, {
      date: "2026-05-11",
      hasBath: false,
      hasMfr: false,
      hasMassage: false,
      sleepHours: "07:30",
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: `${RECOVERY_MFR_LABEL}: нет`,
      pending: "recoverySelect",
      userId: 20,
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: `${RECOVERY_MASSAGE_LABEL}: нет`,
      pending: "recoverySelect",
      userId: 20,
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: `${RECOVERY_BATH_LABEL}: нет`,
      pending: "recoverySelect",
      userId: 20,
    });

    expect(getRecoveryDraft(10)).toMatchObject({
      hasBath: true,
      hasMfr: true,
      hasMassage: true,
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: RECOVERY_SAVE_BUTTON_TEXT,
      pending: "recoverySelect",
      userId: 20,
    });

    expect(recoveryMocks.upsertRecoveryEntryMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2026-05-11",
      hasBath: true,
      hasMfr: true,
      hasMassage: true,
      sleepHours: 7.5,
    });
    expect(getPendingInput(10)).toBeNull();
    expect(getRecoveryDraft(10).date).toBeNull();
    expect(ctx.reply).toHaveBeenLastCalledWith(
      "Отметки восстановления сохранены.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен переводить на ввод сна и валидировать значение при сохранении", async () => {
    const ctx = createContext();
    setRecoveryDraft(10, {
      date: "2026-05-11",
      sleepHours: "25:00",
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: `${RECOVERY_SLEEP_LABEL}: -`,
      pending: "recoverySelect",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("recoverySleep");

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: RECOVERY_SAVE_BUTTON_TEXT,
      pending: "recoverySelect",
      userId: 20,
    });

    expect(recoveryMocks.upsertRecoveryEntryMock).not.toHaveBeenCalled();
    expect(getPendingInput(10)).toBe("recoverySleep");
    expect(ctx.reply).toHaveBeenLastCalledWith(
      "Введите время сна в формате ЧЧ:ММ (например, 07:30).",
      {
        reply_markup: buildRecoverySleepReplyKeyboard(),
      }
    );
  });

  it("должен обновлять, очищать и отклонять ввод сна", async () => {
    const ctx = createContext();
    setRecoveryDraft(10, {
      date: "2026-05-11",
      sleepHours: "",
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: "bad",
      pending: "recoverySleep",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("recoverySelect");
    expect(ctx.reply).toHaveBeenLastCalledWith(
      "Сон обновлен. Можно выбрать восстановление или сохранить.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );

    setPendingInput(10, "recoverySleep");

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: "25:00",
      pending: "recoverySleep",
      userId: 20,
    });

    expect(ctx.reply).toHaveBeenLastCalledWith(
      "Введите время сна в формате ЧЧ:ММ (например, 07:30).",
      {
        reply_markup: buildRecoverySleepReplyKeyboard(),
      }
    );

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: RECOVERY_CLEAR_SLEEP_BUTTON_TEXT,
      pending: "recoverySleep",
      userId: 20,
    });

    expect(getRecoveryDraft(10).sleepHours).toBe("");
    expect(getPendingInput(10)).toBe("recoverySelect");

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: "0730",
      pending: "recoverySleep",
      userId: 20,
    });

    expect(getRecoveryDraft(10).sleepHours).toBe("07:30");
    expect(getPendingInput(10)).toBe("recoverySelect");
  });

  it("должен возвращаться назад и в главное меню", async () => {
    const ctx = createContext();
    setRecoveryDraft(10, {
      date: "2026-05-11",
      sleepHours: "07:30",
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "recoverySelect",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("weightAction");

    setRecoveryDraft(10, {
      date: "2026-05-11",
      sleepHours: "07:30",
    });

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "recoverySleep",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("recoverySelect");

    await handleRecoveryPending({
      ctx,
      chatId: 10,
      text: REPORT_MAIN_MENU_BUTTON_TEXT,
      pending: "recoverySleep",
      userId: 20,
    });

    expect(getPendingInput(10)).toBeNull();
    expect(getRecoveryDraft(10).date).toBeNull();
  });
});
