import { beforeEach, describe, expect, it, vi } from "vitest";

const linkPendingMocks = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
  linkAccountMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: linkPendingMocks.ensureLinkedMock,
}));

vi.mock("@/bot/services/telegramSubscriptions", () => ({
  getSubscription: linkPendingMocks.getSubscriptionMock,
}));

vi.mock("@/bot/services/telegramLinking", () => ({
  linkAccount: linkPendingMocks.linkAccountMock,
}));

import { handleLinkPending } from "@/bot/commands/handlers/textMessage/pending/handleLink";
import { buildCancelLinkReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { clearPendingInput, getPendingInput, setPendingInput } from "@/bot/menu/menuState";

function createContext() {
  return {
    from: {
      username: "runner",
      first_name: "Runner",
    },
    reply: vi.fn(),
  };
}

describe("handleLinkPending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingInput(10);
    setPendingInput(10, "link");
    linkPendingMocks.ensureLinkedMock.mockResolvedValue(20);
    linkPendingMocks.getSubscriptionMock.mockResolvedValue({ enabled: true });
    linkPendingMocks.linkAccountMock.mockResolvedValue({ ok: true });
  });

  it("должен требовать шестизначный код", async () => {
    const ctx = createContext();

    await handleLinkPending({ ctx, chatId: 10, text: "bad" });

    expect(linkPendingMocks.linkAccountMock).not.toHaveBeenCalled();
    expect(getPendingInput(10)).toBe("link");
    expect(ctx.reply).toHaveBeenCalledWith("Введите 6-значный код с сайта.", {
      reply_markup: buildCancelLinkReplyKeyboard(),
    });
  });

  it("должен связывать аккаунт и очищать pending", async () => {
    const ctx = createContext();

    await handleLinkPending({ ctx, chatId: 10, text: "123456" });

    expect(linkPendingMocks.linkAccountMock).toHaveBeenCalledWith({
      chatId: 10,
      code: "123456",
      username: "runner",
      firstName: "Runner",
    });
    expect(getPendingInput(10)).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith("Аккаунт успешно связан. Меню управления ниже.", {
      reply_markup: expect.any(Object),
    });
  });

  it("должен обрабатывать уже связанный чат с главным меню или меню связки", async () => {
    const linkedCtx = createContext();
    const fallbackCtx = createContext();

    linkPendingMocks.linkAccountMock.mockResolvedValue({ ok: false, error: "чат-уже-связан" });
    linkPendingMocks.ensureLinkedMock.mockResolvedValueOnce(20).mockResolvedValueOnce(null);

    await handleLinkPending({ ctx: linkedCtx, chatId: 10, text: "111111" });

    setPendingInput(10, "link");

    await handleLinkPending({ ctx: fallbackCtx, chatId: 10, text: "222222" });

    expect(linkedCtx.reply).toHaveBeenCalledWith("Этот чат уже связан с аккаунтом.", {
      reply_markup: expect.any(Object),
    });
    expect(fallbackCtx.reply).toHaveBeenCalledWith("Этот чат уже связан с аккаунтом.", {
      reply_markup: expect.any(Object),
    });
    expect(getPendingInput(10)).toBeNull();
  });

  it("должен сообщать о связанном пользователе и недействительном коде", async () => {
    const userLinkedCtx = createContext();
    const expiredCtx = createContext();

    linkPendingMocks.linkAccountMock
      .mockResolvedValueOnce({ ok: false, error: "пользователь-уже-связан" })
      .mockResolvedValueOnce({ ok: false, error: "код-недействителен" });

    await handleLinkPending({ ctx: userLinkedCtx, chatId: 10, text: "111111" });
    await handleLinkPending({ ctx: expiredCtx, chatId: 10, text: "222222" });

    expect(userLinkedCtx.reply).toHaveBeenCalledWith(
      "Аккаунт уже связан с Telegram. Попробуйте другой код.",
      {
        reply_markup: buildCancelLinkReplyKeyboard(),
      }
    );
    expect(expiredCtx.reply).toHaveBeenCalledWith(
      "Код недействителен или истек. Попробуйте другой.",
      {
        reply_markup: buildCancelLinkReplyKeyboard(),
      }
    );
  });
});
