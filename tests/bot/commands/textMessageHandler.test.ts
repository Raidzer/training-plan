import { beforeEach, describe, expect, it, vi } from "vitest";

const textHandlerMocks = vi.hoisted(() => ({
  getMenuActionByTextMock: vi.fn(),
  getPendingInputMock: vi.fn(),
  handleMenuActionMock: vi.fn(),
  handlePendingInputMock: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/helpers", () => ({
  getMenuActionByText: textHandlerMocks.getMenuActionByTextMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/handleMenuAction", () => ({
  handleMenuAction: textHandlerMocks.handleMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/handlePendingInput", () => ({
  handlePendingInput: textHandlerMocks.handlePendingInputMock,
}));

vi.mock("@/bot/menu/menuState", () => ({
  getPendingInput: textHandlerMocks.getPendingInputMock,
}));

import { registerTextMessageHandler } from "@/bot/commands/handlers/textMessageHandler";

type TextHandler = (ctx: any) => Promise<void>;

function createBotHarness() {
  const harness: { handler?: TextHandler } = {};
  const bot = {
    on: vi.fn((_event: string, nextHandler: TextHandler) => {
      harness.handler = nextHandler;
    }),
  };

  registerTextMessageHandler(bot as any);

  if (!harness.handler) {
    throw new Error("Text handler was not registered");
  }

  return {
    bot,
    handler: harness.handler,
  };
}

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    chat: {
      id: 10,
      type: "private",
    },
    message: {
      text: " Меню ",
    },
    reply: vi.fn(),
    ...overrides,
  };
}

describe("registerTextMessageHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    textHandlerMocks.getPendingInputMock.mockReturnValue(null);
    textHandlerMocks.getMenuActionByTextMock.mockReturnValue(null);
  });

  it("должен регистрировать обработчик текстовых сообщений", () => {
    const { bot, handler } = createBotHarness();

    expect(bot.on).toHaveBeenCalledWith("message:text", expect.any(Function));
    expect(handler).toEqual(expect.any(Function));
  });

  it("должен игнорировать сообщения вне приватного чата, пустой текст и команды", async () => {
    const { handler } = createBotHarness();

    await handler(createContext({ chat: undefined }));
    await handler(createContext({ chat: { id: 10, type: "group" } }));
    await handler(createContext({ message: { text: "   " } }));
    await handler(createContext({ message: { text: "/start" } }));

    expect(textHandlerMocks.getPendingInputMock).not.toHaveBeenCalled();
    expect(textHandlerMocks.handleMenuActionMock).not.toHaveBeenCalled();
    expect(textHandlerMocks.handlePendingInputMock).not.toHaveBeenCalled();
  });

  it("должен отправлять меню-действие когда pending отсутствует", async () => {
    const { handler } = createBotHarness();
    const ctx = createContext({ message: { text: " Сегодня " } });

    textHandlerMocks.getMenuActionByTextMock.mockReturnValue("today");

    await handler(ctx);

    expect(textHandlerMocks.getMenuActionByTextMock).toHaveBeenCalledWith("Сегодня");
    expect(textHandlerMocks.handleMenuActionMock).toHaveBeenCalledWith({
      ctx,
      chatId: 10,
      action: "today",
    });
    expect(textHandlerMocks.handlePendingInputMock).not.toHaveBeenCalled();
  });

  it("должен игнорировать неизвестный текст без pending", async () => {
    const { handler } = createBotHarness();

    await handler(createContext({ message: { text: "что-то" } }));

    expect(textHandlerMocks.handleMenuActionMock).not.toHaveBeenCalled();
    expect(textHandlerMocks.handlePendingInputMock).not.toHaveBeenCalled();
  });

  it("должен отправлять текст в pending handler", async () => {
    const { handler } = createBotHarness();
    const ctx = createContext({ message: { text: " 21-12-2025 " } });

    textHandlerMocks.getPendingInputMock.mockReturnValue("date");

    await handler(ctx);

    expect(textHandlerMocks.handlePendingInputMock).toHaveBeenCalledWith({
      ctx,
      chatId: 10,
      text: "21-12-2025",
      pending: "date",
    });
  });
});
