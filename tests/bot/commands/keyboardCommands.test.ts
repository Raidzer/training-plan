import { beforeEach, describe, expect, it, vi } from "vitest";

const keyboardCommandMocks = vi.hoisted(() => ({
  getLinkedAccountDetailsMock: vi.fn(),
  setPendingInputMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  getLinkedAccountDetails: keyboardCommandMocks.getLinkedAccountDetailsMock,
}));

vi.mock("@/bot/menu/menuState", () => ({
  setPendingInput: keyboardCommandMocks.setPendingInputMock,
}));

import { registerKeyboardCommands } from "@/bot/commands/handlers/keyboardCommands";
import { buildCancelReplyKeyboard } from "@/bot/menu/menuKeyboard";

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
    expect(keyboardCommandMocks.setPendingInputMock).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("должен запрещать запуск вне личного чата", async () => {
    const { handlers } = createBotHarness();
    const ctx = createContext({ chat: { id: 10, type: "group" } });

    await (handlers.get("refresh_keyboards") as CommandHandler)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith("Команда доступна только в личных сообщениях.");
    expect(keyboardCommandMocks.setPendingInputMock).not.toHaveBeenCalled();
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
    expect(keyboardCommandMocks.setPendingInputMock).not.toHaveBeenCalled();
  });

  it("должен запрашивать сообщение у администратора", async () => {
    const { handlers } = createBotHarness();
    const ctx = createContext();

    await (handlers.get("refresh_keyboards") as CommandHandler)(ctx);

    expect(keyboardCommandMocks.setPendingInputMock).toHaveBeenCalledWith(
      10,
      "keyboardRefreshMessage"
    );
    expect(ctx.reply).toHaveBeenCalledWith("Введите сообщение пользователям для обновления.", {
      reply_markup: buildCancelReplyKeyboard(),
    });
  });
});
