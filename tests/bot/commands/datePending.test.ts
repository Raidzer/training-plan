import { beforeEach, describe, expect, it, vi } from "vitest";

const datePendingMocks = vi.hoisted(() => ({
  getSubscriptionMock: vi.fn(),
  getPlanEntriesByDateMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: datePendingMocks.getSubscriptionMock,
}));

vi.mock("@/server/planEntries", () => ({
  getPlanEntriesByDate: datePendingMocks.getPlanEntriesByDateMock,
}));

import { handleDatePending } from "@/bot/commands/handlers/textMessage/pending/handleDate";
import {
  buildBackReplyKeyboard,
  CUSTOM_DATE_BUTTON_TEXT,
  DATE_BACK_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, getPendingInput, setPendingInput } from "@/bot/menu/menuState";

function createContext() {
  return {
    reply: vi.fn(),
  };
}

describe("handleDatePending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingInput(10);
    datePendingMocks.getSubscriptionMock.mockResolvedValue({ enabled: true });
    datePendingMocks.getPlanEntriesByDateMock.mockResolvedValue([]);
  });

  it("должен возвращаться из меню даты в главное меню", async () => {
    const ctx = createContext();
    setPendingInput(10, "dateMenu");

    await handleDatePending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "dateMenu",
      userId: 20,
    });

    expect(getPendingInput(10)).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(
      "Меню управления ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен переводить меню даты на ручной ввод", async () => {
    const ctx = createContext();

    await handleDatePending({
      ctx,
      chatId: 10,
      text: CUSTOM_DATE_BUTTON_TEXT,
      pending: "dateMenu",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("date");
    expect(ctx.reply).toHaveBeenCalledWith(
      "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025).",
      {
        reply_markup: buildBackReplyKeyboard(),
      }
    );
  });

  it("должен валидировать выбор из меню даты", async () => {
    const ctx = createContext();

    await handleDatePending({
      ctx,
      chatId: 10,
      text: "не дата",
      pending: "dateMenu",
      userId: 20,
    });

    expect(datePendingMocks.getPlanEntriesByDateMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('Выбери дату из списка или нажми "Произвольная дата".');
  });

  it("должен показывать план по дате из меню", async () => {
    const ctx = createContext();
    setPendingInput(10, "dateMenu");

    await handleDatePending({
      ctx,
      chatId: 10,
      text: "21-12-2025",
      pending: "dateMenu",
      userId: 20,
    });

    expect(datePendingMocks.getPlanEntriesByDateMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2025-12-21",
    });
    expect(getPendingInput(10)).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(
      "На 21-12-2025 нет тренировок.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен валидировать ручной ввод даты", async () => {
    const ctx = createContext();

    await handleDatePending({
      ctx,
      chatId: 10,
      text: "bad-date",
      pending: "date",
      userId: 20,
    });

    expect(ctx.reply).toHaveBeenCalledWith(
      "Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025).",
      {
        reply_markup: buildBackReplyKeyboard(),
      }
    );
  });

  it("должен возвращать ручной ввод даты к меню дат", async () => {
    const ctx = createContext();

    await handleDatePending({
      ctx,
      chatId: 10,
      text: DATE_BACK_BUTTON_TEXT,
      pending: "date",
      userId: 20,
    });

    expect(getPendingInput(10)).toBe("dateMenu");
    expect(ctx.reply).toHaveBeenCalledWith(
      'Выбери дату из списка или нажми "Произвольная дата".',
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен показывать план по ручной дате", async () => {
    const ctx = createContext();
    setPendingInput(10, "date");
    datePendingMocks.getPlanEntriesByDateMock.mockResolvedValueOnce([
      {
        id: 1,
        date: "2025-12-21",
        sessionOrder: 1,
        taskText: "Кросс",
        commentText: null,
        isWorkload: false,
      },
    ]);

    await handleDatePending({
      ctx,
      chatId: 10,
      text: "21-12-2025",
      pending: "date",
      userId: 20,
    });

    expect(getPendingInput(10)).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(
      ["План на 21-12-2025:", "1.", "Кросс"].join("\n"),
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });
});
