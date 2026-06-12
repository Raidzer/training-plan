import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const planMocks = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
  getPlanEntriesByDateMock: vi.fn(),
  getDailyReportTextByDateMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: planMocks.ensureLinkedMock,
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: planMocks.getSubscriptionMock,
}));

vi.mock("@/server/planEntries", () => ({
  getPlanEntriesByDate: planMocks.getPlanEntriesByDateMock,
}));

vi.mock("@/server/diary", () => ({
  getDailyReportTextByDate: planMocks.getDailyReportTextByDateMock,
}));

import { registerPlanCommands } from "@/bot/commands/handlers/planCommands";
import {
  buildDailyReportMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  CUSTOM_DATE_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, getPendingInput } from "@/bot/menu/menuState";

const DATE_MENU_PROMPT_TEXT = `Выбери дату из списка или нажми "${CUSTOM_DATE_BUTTON_TEXT}".`;

type CommandHandler = (ctx: any) => Promise<unknown>;

function createBotHarness() {
  const handlers = new Map<string, CommandHandler>();
  const bot = {
    command: vi.fn((name: string, handler: CommandHandler) => {
      handlers.set(name, handler);
    }),
  };

  registerPlanCommands(bot as any);

  return handlers;
}

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    chat: {
      id: 10,
      type: "private",
    },
    message: {
      text: "",
    },
    reply: vi.fn(),
    ...overrides,
  };
}

describe("registerPlanCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    clearPendingInput(10);
    planMocks.ensureLinkedMock.mockResolvedValue(20);
    planMocks.getSubscriptionMock.mockResolvedValue({
      enabled: true,
      timezone: "Europe/Moscow",
    });
    planMocks.getPlanEntriesByDateMock.mockResolvedValue([]);
    planMocks.getDailyReportTextByDateMock.mockResolvedValue("Готовый отчет");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("должен регистрировать команды плана", () => {
    const handlers = createBotHarness();

    expect(Array.from(handlers.keys()).sort()).toEqual(["date", "report", "today"]);
  });

  it("должен игнорировать команды плана без чата", async () => {
    const handlers = createBotHarness();
    const ctx = createContext({ chat: undefined });

    await (handlers.get("today") as CommandHandler)(ctx);
    await (handlers.get("date") as CommandHandler)(ctx);
    await (handlers.get("report") as CommandHandler)(ctx);

    expect(planMocks.ensureLinkedMock).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("должен требовать связанный аккаунт", async () => {
    const handlers = createBotHarness();
    const todayCtx = createContext();
    const dateCtx = createContext({ message: { text: "/date 21-12-2025" } });
    const reportCtx = createContext({ message: { text: "/report 21-12-2025" } });

    planMocks.ensureLinkedMock.mockResolvedValue(null);

    await (handlers.get("today") as CommandHandler)(todayCtx);
    await (handlers.get("date") as CommandHandler)(dateCtx);
    await (handlers.get("report") as CommandHandler)(reportCtx);

    expect(todayCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    expect(dateCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
    expect(reportCtx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт кнопкой ниже.", {
      reply_markup: buildLinkReplyKeyboard(),
    });
  });

  it("должен показывать план на сегодня с учетом таймзоны или времени сервера", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T09:30:00.000Z"));

    const handlers = createBotHarness();
    const timezoneCtx = createContext();
    const serverTimeCtx = createContext();

    planMocks.getSubscriptionMock
      .mockResolvedValueOnce({ enabled: true, timezone: "Europe/Moscow" })
      .mockResolvedValueOnce({ enabled: true, timezone: null });

    await (handlers.get("today") as CommandHandler)(timezoneCtx);
    await (handlers.get("today") as CommandHandler)(serverTimeCtx);

    expect(planMocks.getPlanEntriesByDateMock).toHaveBeenNthCalledWith(1, {
      userId: 20,
      date: "2026-05-11",
    });
    expect(planMocks.getPlanEntriesByDateMock).toHaveBeenNthCalledWith(2, {
      userId: 20,
      date: "2026-05-11",
    });
    expect(timezoneCtx.reply).toHaveBeenCalledWith("На 11-05-2026 нет тренировок.");
    expect(serverTimeCtx.reply).toHaveBeenCalledWith(
      "На 11-05-2026 нет тренировок.\n\nТаймзона не задана, использую время сервера."
    );
  });

  it("должен валидировать дату и показывать план по дате", async () => {
    const handlers = createBotHarness();
    const missingCtx = createContext({ message: { text: "/date" } });
    const invalidCtx = createContext({ message: { text: "/date 32-12-2025" } });
    const validCtx = createContext({ message: { text: "/date 21-12-2025" } });

    planMocks.getPlanEntriesByDateMock.mockResolvedValueOnce([
      {
        id: 1,
        date: "2025-12-21",
        sessionOrder: 1,
        taskText: "Кросс 8 км",
        commentText: null,
        isWorkload: false,
      },
    ]);

    await (handlers.get("date") as CommandHandler)(missingCtx);

    expect(missingCtx.reply).toHaveBeenCalledWith(
      DATE_MENU_PROMPT_TEXT,
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );

    await (handlers.get("date") as CommandHandler)(invalidCtx);

    expect(invalidCtx.reply).toHaveBeenCalledWith(
      DATE_MENU_PROMPT_TEXT,
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(getPendingInput(10)).toBe("dateMenu");

    await (handlers.get("date") as CommandHandler)(validCtx);

    expect(planMocks.getPlanEntriesByDateMock).toHaveBeenCalledWith({
      userId: 20,
      date: "2025-12-21",
    });
    expect(validCtx.reply).toHaveBeenCalledWith(
      ["План на 21-12-2025:", "1.", "Кросс 8 км"].join("\n")
    );
  });

  it("должен формировать дневной отчет по дате или за сегодня", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T09:30:00.000Z"));

    const handlers = createBotHarness();
    const invalidCtx = createContext({ message: { text: "/report 32-12-2025" } });
    const dateCtx = createContext({ message: { text: "/report 21-12-2025" } });
    const timezoneCtx = createContext({ message: { text: "/report" } });
    const serverTimeCtx = createContext({ message: { text: "/report" } });

    planMocks.getSubscriptionMock
      .mockResolvedValueOnce({ enabled: true, timezone: "Europe/Moscow" })
      .mockResolvedValueOnce({ enabled: true, timezone: "Europe/Moscow" })
      .mockResolvedValueOnce({ enabled: true, timezone: "Europe/Moscow" })
      .mockResolvedValueOnce({ enabled: true, timezone: null });

    await (handlers.get("report") as CommandHandler)(invalidCtx);

    expect(invalidCtx.reply).toHaveBeenCalledWith("Выбери дату для ежедневного отчета.", {
      reply_markup: buildDailyReportMenuReplyKeyboard(),
    });
    expect(getPendingInput(10)).toBe("dailyReportMenu");

    await (handlers.get("report") as CommandHandler)(dateCtx);
    await (handlers.get("report") as CommandHandler)(timezoneCtx);
    await (handlers.get("report") as CommandHandler)(serverTimeCtx);

    expect(planMocks.getDailyReportTextByDateMock).toHaveBeenNthCalledWith(1, {
      userId: 20,
      date: "2025-12-21",
    });
    expect(planMocks.getDailyReportTextByDateMock).toHaveBeenNthCalledWith(2, {
      userId: 20,
      date: "2026-05-11",
    });
    expect(planMocks.getDailyReportTextByDateMock).toHaveBeenNthCalledWith(3, {
      userId: 20,
      date: "2026-05-11",
    });
    expect(dateCtx.reply).toHaveBeenCalledWith("Готовый отчет");
    expect(timezoneCtx.reply).toHaveBeenCalledWith("Готовый отчет");
    expect(serverTimeCtx.reply).toHaveBeenCalledWith(
      "Готовый отчет\n\nТаймзона не задана, использую время сервера."
    );
  });
});
