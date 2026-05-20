import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSubscriptionMock, setPendingInputMock, getDailyReportTextByDateMock } = vi.hoisted(
  () => {
    return {
      getSubscriptionMock: vi.fn(),
      setPendingInputMock: vi.fn(),
      getDailyReportTextByDateMock: vi.fn(),
    };
  }
);

vi.mock("@/bot/services/telegramSubscriptions", () => {
  return {
    getSubscription: getSubscriptionMock,
  };
});

vi.mock("@/bot/menu/menuState", async () => {
  const actual =
    await vi.importActual<typeof import("@/bot/menu/menuState")>("@/bot/menu/menuState");
  return {
    ...actual,
    setPendingInput: setPendingInputMock,
  };
});

vi.mock("@/server/diary", () => {
  return {
    getDailyReportTextByDate: getDailyReportTextByDateMock,
  };
});

import { handlePlanMenuAction } from "@/bot/commands/handlers/textMessage/menu/handlePlanAction";
import { handleDailyReportPending } from "@/bot/commands/handlers/textMessage/pending/handleDailyReport";
import {
  buildCancelReplyKeyboard,
  buildDailyReportMenuReplyKeyboard,
  buildMainMenuReplyKeyboard,
} from "@/bot/menu/menuKeyboard";

describe("daily report flow", () => {
  const replyMock = vi.fn();
  const ctx = {
    reply: replyMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getSubscriptionMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
    });
    getDailyReportTextByDateMock.mockResolvedValue("Готовый отчет");
  });

  it("должен открывать подменю выбора даты для ежедневного отчета", async () => {
    await handlePlanMenuAction({
      ctx,
      chatId: 10,
      userId: 20,
      action: "dailyReport",
    });

    expect(setPendingInputMock).toHaveBeenCalledWith(10, "dailyReportMenu");
    expect(replyMock).toHaveBeenCalledWith("Выбери дату для ежедневного отчета.", {
      reply_markup: buildDailyReportMenuReplyKeyboard(),
    });
    expect(getDailyReportTextByDateMock).not.toHaveBeenCalled();
  });

  it("должен запрашивать дату и показывать кнопку отмены", async () => {
    await handleDailyReportPending({
      ctx,
      chatId: 10,
      userId: 20,
      text: "Произвольная дата",
      pending: "dailyReportMenu",
    });

    expect(setPendingInputMock).toHaveBeenCalledWith(10, "dailyReportDate");
    expect(replyMock).toHaveBeenCalledWith(
      'Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или нажмите кнопку "Отмена".',
      {
        reply_markup: buildCancelReplyKeyboard(),
      }
    );
  });

  it("должен повторно запрашивать дату при невалидном вводе", async () => {
    await handleDailyReportPending({
      ctx,
      chatId: 10,
      userId: 20,
      text: "bad-date",
      pending: "dailyReportDate",
    });

    expect(getDailyReportTextByDateMock).not.toHaveBeenCalled();
    expect(replyMock).toHaveBeenCalledWith(
      'Введите дату в формате ДД-ММ-ГГГГ (например, 21-12-2025) или нажмите кнопку "Отмена".',
      {
        reply_markup: buildCancelReplyKeyboard(),
      }
    );
  });

  it("должен формировать отчет по введенной дате и возвращать в главное меню", async () => {
    await handleDailyReportPending({
      ctx,
      chatId: 10,
      userId: 20,
      text: "21-12-2025",
      pending: "dailyReportDate",
    });

    expect(getDailyReportTextByDateMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2025-12-21",
    });
    expect(replyMock).toHaveBeenCalledWith("Готовый отчет", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });
  });

  it("должен формировать отчет за сегодня из подменю", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T08:15:00.000Z"));

    await handleDailyReportPending({
      ctx,
      chatId: 10,
      userId: 20,
      text: "Сегодня",
      pending: "dailyReportMenu",
    });

    expect(getDailyReportTextByDateMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2026-04-18",
    });
    expect(replyMock).toHaveBeenCalledWith("Готовый отчет", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });

    vi.useRealTimers();
  });
});
