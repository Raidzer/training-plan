import { beforeEach, describe, expect, it, vi } from "vitest";

const accountMocks = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
  getLinkedAccountMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
  linkAccountMock: vi.fn(),
  unlinkAccountMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: accountMocks.ensureLinkedMock,
  getLinkedAccount: accountMocks.getLinkedAccountMock,
  unlinkAccount: accountMocks.unlinkAccountMock,
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: accountMocks.getSubscriptionMock,
}));

vi.mock("@/bot/services/telegramLinking", () => ({
  linkAccount: accountMocks.linkAccountMock,
}));

import { registerAccountCommands } from "@/bot/commands/handlers/accountCommands";
import { buildCancelLinkReplyKeyboard } from "@/bot/menu/menuKeyboard";

type CommandHandler = (ctx: any) => Promise<unknown>;

function createBotHarness() {
  const handlers = new Map<string, CommandHandler>();
  const bot = {
    command: vi.fn((name: string, handler: CommandHandler) => {
      handlers.set(name, handler);
    }),
  };

  registerAccountCommands(bot as any);

  return handlers;
}

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    chat: {
      id: 10,
      type: "private",
    },
    from: {
      username: "runner",
      first_name: "Runner",
    },
    message: {
      text: "",
    },
    reply: vi.fn(),
    ...overrides,
  };
}

describe("registerAccountCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountMocks.ensureLinkedMock.mockResolvedValue(null);
    accountMocks.getLinkedAccountMock.mockResolvedValue(null);
    accountMocks.getSubscriptionMock.mockResolvedValue(null);
    accountMocks.linkAccountMock.mockResolvedValue({ ok: true });
  });

  it("должен регистрировать команды аккаунта", () => {
    const handlers = createBotHarness();

    expect(Array.from(handlers.keys()).sort()).toEqual(["link", "menu", "start", "unlink"]);
  });

  it("должен обрабатывать /start и /menu для связанных и несвязанных чатов", async () => {
    const handlers = createBotHarness();
    const startHandler = handlers.get("start") as CommandHandler;
    const menuHandler = handlers.get("menu") as CommandHandler;
    const unlinkedStartCtx = createContext();
    const linkedStartCtx = createContext();
    const unlinkedMenuCtx = createContext();
    const linkedMenuCtx = createContext();

    accountMocks.ensureLinkedMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(30);
    accountMocks.getSubscriptionMock
      .mockResolvedValueOnce({ enabled: true })
      .mockResolvedValueOnce({ enabled: false });

    await startHandler(unlinkedStartCtx);
    await startHandler(linkedStartCtx);
    await menuHandler(unlinkedMenuCtx);
    await menuHandler(linkedMenuCtx);

    expect(unlinkedStartCtx.reply).toHaveBeenCalledWith(
      "Привет! Чтобы связать аккаунт, получи код на сайте и нажми кнопку ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(linkedStartCtx.reply).toHaveBeenCalledWith(
      "Привет! Меню управления ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(unlinkedMenuCtx.reply).toHaveBeenCalledWith(
      "Меню управления доступно после связки. Получи код на сайте и нажми кнопку ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(linkedMenuCtx.reply).toHaveBeenCalledWith(
      "Меню управления:",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
  });

  it("должен отвечать в личку для /start и /menu вне приватного чата", async () => {
    const handlers = createBotHarness();
    const startCtx = createContext({ chat: { id: 10, type: "group" } });
    const menuCtx = createContext({ chat: { id: 10, type: "supergroup" } });

    await (handlers.get("start") as CommandHandler)(startCtx);
    await (handlers.get("menu") as CommandHandler)(menuCtx);

    expect(startCtx.reply).toHaveBeenCalledWith("Напишите мне в личные сообщения.");
    expect(menuCtx.reply).toHaveBeenCalledWith("Напишите мне в личные сообщения.");
    expect(accountMocks.ensureLinkedMock).not.toHaveBeenCalled();
  });

  it("должен связывать аккаунт по deep link payload из /start", async () => {
    const handlers = createBotHarness();
    const startHandler = handlers.get("start") as CommandHandler;
    const ctx = createContext({ match: "deep-link-token" });

    accountMocks.ensureLinkedMock.mockResolvedValue(20);
    accountMocks.getSubscriptionMock.mockResolvedValue({ enabled: true });
    accountMocks.linkAccountMock.mockResolvedValue({ ok: true });

    await startHandler(ctx);

    expect(accountMocks.linkAccountMock).toHaveBeenCalledWith({
      chatId: 10,
      code: "deep-link-token",
      username: "runner",
      firstName: "Runner",
    });
    expect(ctx.reply).toHaveBeenCalledWith("Аккаунт успешно связан. Меню управления ниже.", {
      reply_markup: expect.any(Object),
    });
  });

  it("должен отклонять невалидный payload из /start", async () => {
    const handlers = createBotHarness();
    const startHandler = handlers.get("start") as CommandHandler;
    const ctx = createContext({ match: "bad payload" });

    await startHandler(ctx);

    expect(accountMocks.linkAccountMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      "Ссылка для привязки недействительна или истекла. Получите новую ссылку на сайте.",
      {
        reply_markup: expect.any(Object),
      }
    );
  });

  it("должен валидировать /link и связывать аккаунт по коду", async () => {
    const handlers = createBotHarness();
    const linkHandler = handlers.get("link") as CommandHandler;
    const groupCtx = createContext({ chat: { id: 10, type: "group" } });
    const invalidCtx = createContext({ message: { text: "/link bad" } });
    const successCtx = createContext({ message: { text: "/link 123456" } });

    accountMocks.ensureLinkedMock.mockResolvedValue(20);
    accountMocks.getSubscriptionMock.mockResolvedValue({ enabled: true });
    accountMocks.linkAccountMock.mockResolvedValue({ ok: true });

    await linkHandler(groupCtx);
    await linkHandler(invalidCtx);
    await linkHandler(successCtx);

    expect(groupCtx.reply).toHaveBeenCalledWith("Связка доступна только в личных сообщениях.");
    expect(invalidCtx.reply).toHaveBeenCalledWith("Введите 6-значный код с сайта.", {
      reply_markup: buildCancelLinkReplyKeyboard(),
    });
    expect(accountMocks.linkAccountMock).toHaveBeenCalledWith({
      chatId: 10,
      code: "123456",
      username: "runner",
      firstName: "Runner",
    });
    expect(successCtx.reply).toHaveBeenCalledWith("Аккаунт успешно связан. Меню управления ниже.", {
      reply_markup: expect.any(Object),
    });
  });

  it("должен отвечать понятными ошибками при неуспешном /link", async () => {
    const handlers = createBotHarness();
    const linkHandler = handlers.get("link") as CommandHandler;
    const alreadyLinkedCtx = createContext({ message: { text: "/link 111111" } });
    const userLinkedCtx = createContext({ message: { text: "/link 222222" } });
    const expiredCtx = createContext({ message: { text: "/link 333333" } });

    accountMocks.linkAccountMock
      .mockResolvedValueOnce({ ok: false, error: "чат-уже-связан" })
      .mockResolvedValueOnce({ ok: false, error: "пользователь-уже-связан" })
      .mockResolvedValueOnce({ ok: false, error: "код-истек" });
    accountMocks.ensureLinkedMock.mockResolvedValue(20);
    accountMocks.getSubscriptionMock.mockResolvedValue({ enabled: false });

    await linkHandler(alreadyLinkedCtx);
    await linkHandler(userLinkedCtx);
    await linkHandler(expiredCtx);

    expect(alreadyLinkedCtx.reply).toHaveBeenCalledWith("Этот чат уже связан с аккаунтом.", {
      reply_markup: expect.any(Object),
    });
    expect(userLinkedCtx.reply).toHaveBeenCalledWith("Аккаунт уже связан с Telegram.", {
      reply_markup: expect.any(Object),
    });
    expect(expiredCtx.reply).toHaveBeenCalledWith("Код недействителен или истек.", {
      reply_markup: expect.any(Object),
    });
  });

  it("должен удалять связь аккаунта через /unlink", async () => {
    const handlers = createBotHarness();
    const unlinkHandler = handlers.get("unlink") as CommandHandler;
    const noChatCtx = createContext({ chat: undefined });
    const unlinkedCtx = createContext();
    const linkedCtx = createContext();

    accountMocks.getLinkedAccountMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: 20 });

    await unlinkHandler(noChatCtx);
    await unlinkHandler(unlinkedCtx);
    await unlinkHandler(linkedCtx);

    expect(unlinkedCtx.reply).toHaveBeenCalledWith("Этот чат не связан с аккаунтом.");
    expect(accountMocks.unlinkAccountMock).toHaveBeenCalledWith(10);
    expect(linkedCtx.reply).toHaveBeenCalledWith(
      "Связка удалена. Теперь можно привязать другой аккаунт.",
      {
        reply_markup: expect.any(Object),
      }
    );
  });
});
