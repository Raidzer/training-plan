import { beforeEach, describe, expect, it, vi } from "vitest";

const keyboardCommandMocks = vi.hoisted(() => ({
  getLinkedAccountDetailsMock: vi.fn(),
  refreshTelegramKeyboardsMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  getLinkedAccountDetails: keyboardCommandMocks.getLinkedAccountDetailsMock,
}));

vi.mock("@/bot/services/telegramKeyboardRefresh", () => ({
  refreshTelegramKeyboards: keyboardCommandMocks.refreshTelegramKeyboardsMock,
}));

import { registerKeyboardCommands } from "@/bot/commands/handlers/keyboardCommands";
import { buildMainMenuReplyKeyboard } from "@/bot/menu/menuKeyboard";

type CommandHandler = (ctx: any) => Promise<unknown>;

function createBotHarness() {
  const handlers = new Map<string, CommandHandler>();
  const bot = {
    api: {
      sendMessage: vi.fn(),
    },
    command: vi.fn((name: string, handler: CommandHandler) => {
      handlers.set(name, handler);
    }),
  };

  registerKeyboardCommands(bot as any);

  return {
    bot,
    handlers,
  };
}

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    chat: {
      id: 10,
      type: "private",
    },
    reply: vi.fn(),
    ...overrides,
  };
}

describe("registerKeyboardCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    keyboardCommandMocks.getLinkedAccountDetailsMock.mockResolvedValue({
      userId: 20,
      role: "admin",
      subscribed: true,
    });
    keyboardCommandMocks.refreshTelegramKeyboardsMock.mockResolvedValue({
      total: 3,
      sent: 2,
      failed: 1,
    });
  });

  it("должен регистрировать команду обновления клавиатур", () => {
    const { handlers } = createBotHarness();

    expect(Array.from(handlers.keys())).toEqual(["refresh_keyboards"]);
  });

  it("должен игнорировать команду без чата", async () => {
    const { handlers } = createBotHarness();
    const ctx = createContext({ chat: undefined });

    await (handlers.get("refresh_keyboards") as CommandHandler)(ctx);

    expect(keyboardCommandMocks.getLinkedAccountDetailsMock).not.toHaveBeenCalled();
    expect(keyboardCommandMocks.refreshTelegramKeyboardsMock).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("должен запрещать запуск вне личного чата", async () => {
    const { handlers } = createBotHarness();
    const ctx = createContext({ chat: { id: 10, type: "group" } });

    await (handlers.get("refresh_keyboards") as CommandHandler)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith("Команда доступна только в личных сообщениях.");
    expect(keyboardCommandMocks.refreshTelegramKeyboardsMock).not.toHaveBeenCalled();
  });

  it("должен запрещать запуск неадминистратору", async () => {
    const { handlers } = createBotHarness();
    const ctx = createContext();

    keyboardCommandMocks.getLinkedAccountDetailsMock.mockResolvedValueOnce({
      userId: 20,
      role: "coach",
      subscribed: false,
    });

    await (handlers.get("refresh_keyboards") as CommandHandler)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith("Команда доступна только администратору.");
    expect(keyboardCommandMocks.refreshTelegramKeyboardsMock).not.toHaveBeenCalled();
  });

  it("должен запускать обновление клавиатур администратором", async () => {
    const { bot, handlers } = createBotHarness();
    const ctx = createContext();

    await (handlers.get("refresh_keyboards") as CommandHandler)(ctx);

    expect(keyboardCommandMocks.refreshTelegramKeyboardsMock).toHaveBeenCalledWith(bot);
    expect(ctx.reply).toHaveBeenCalledWith(
      "Обновление клавиатур завершено. Отправлено: 2/3. Ошибок: 1.",
      {
        reply_markup: buildMainMenuReplyKeyboard({
          subscribed: true,
        }),
      }
    );
  });
});
