import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduleMocks = vi.hoisted(() => ({
  clearPendingInputMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
  upsertSubscriptionMock: vi.fn(),
}));

vi.mock("@/bot/menu/menuState", async () => {
  const actual =
    await vi.importActual<typeof import("@/bot/menu/menuState")>("@/bot/menu/menuState");

  return {
    ...actual,
    clearPendingInput: scheduleMocks.clearPendingInputMock,
  };
});

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: scheduleMocks.getSubscriptionMock,
  upsertSubscription: scheduleMocks.upsertSubscriptionMock,
}));

import { handleSchedulePending } from "@/bot/commands/handlers/textMessage/pending/handleSchedule";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

function createContext() {
  return {
    reply: vi.fn(),
  };
}

describe("handleSchedulePending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scheduleMocks.getSubscriptionMock.mockResolvedValue({
      enabled: true,
    });
  });

  it("rejects invalid send time and keeps pending state", async () => {
    const ctx = createContext();

    await handleSchedulePending({
      ctx,
      chatId: 10,
      userId: 20,
      pending: "time",
      text: "7:30",
    });

    expect(scheduleMocks.upsertSubscriptionMock).not.toHaveBeenCalled();
    expect(scheduleMocks.clearPendingInputMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      "Введите время в формате HH:MM (например, 07:30) или напишите 'отмена'."
    );
  });

  it("updates send time and returns to main menu", async () => {
    const ctx = createContext();

    await handleSchedulePending({
      ctx,
      chatId: 10,
      userId: 20,
      pending: "time",
      text: "07:30",
    });

    expect(scheduleMocks.upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: 20,
      chatId: 10,
      patch: {
        sendTime: "07:30",
      },
    });
    expect(scheduleMocks.clearPendingInputMock).toHaveBeenCalledWith(10);
    expect(ctx.reply).toHaveBeenCalledWith("Время рассылки обновлено: 07:30.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });
  });

  it("rejects invalid timezone and keeps pending state", async () => {
    const ctx = createContext();

    await handleSchedulePending({
      ctx,
      chatId: 10,
      userId: 20,
      pending: "timezone",
      text: "bad-zone",
    });

    expect(scheduleMocks.upsertSubscriptionMock).not.toHaveBeenCalled();
    expect(scheduleMocks.clearPendingInputMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      "Неверная таймзона. Пример: Europe/Moscow или +3. Или напишите 'отмена'."
    );
  });

  it("updates timezone and returns to main menu", async () => {
    const ctx = createContext();

    await handleSchedulePending({
      ctx,
      chatId: 10,
      userId: 20,
      pending: "timezone",
      text: "Europe/Moscow",
    });

    expect(scheduleMocks.upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: 20,
      chatId: 10,
      patch: {
        timezone: "Europe/Moscow",
      },
    });
    expect(scheduleMocks.clearPendingInputMock).toHaveBeenCalledWith(10);
    expect(ctx.reply).toHaveBeenCalledWith("Таймзона обновлена: Europe/Moscow.", {
      reply_markup: buildMainMenuReplyKeyboard({
        subscribed: true,
      }),
    });
  });
});
