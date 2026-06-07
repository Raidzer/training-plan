import { beforeEach, describe, expect, it, vi } from "vitest";

const menuActionMocks = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
  handleAliceLinkActionMock: vi.fn(),
  handleHelpMenuActionMock: vi.fn(),
  handleLinkMenuActionMock: vi.fn(),
  handlePlanMenuActionMock: vi.fn(),
  handleScheduleMenuActionMock: vi.fn(),
  handleSubscriptionMenuActionMock: vi.fn(),
  handleUnlinkMenuActionMock: vi.fn(),
  handleWeightMenuActionMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: menuActionMocks.ensureLinkedMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleAliceLinkAction", () => ({
  handleAliceLinkAction: menuActionMocks.handleAliceLinkActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleHelpAction", () => ({
  handleHelpMenuAction: menuActionMocks.handleHelpMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleLinkAction", () => ({
  handleLinkMenuAction: menuActionMocks.handleLinkMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handlePlanAction", () => ({
  handlePlanMenuAction: menuActionMocks.handlePlanMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleScheduleAction", () => ({
  handleScheduleMenuAction: menuActionMocks.handleScheduleMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleSubscriptionAction", () => ({
  handleSubscriptionMenuAction: menuActionMocks.handleSubscriptionMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleUnlinkAction", () => ({
  handleUnlinkMenuAction: menuActionMocks.handleUnlinkMenuActionMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleWeightAction", () => ({
  handleWeightMenuAction: menuActionMocks.handleWeightMenuActionMock,
}));

import { handleMenuAction } from "@/bot/commands/handlers/textMessage/handleMenuAction";

function createContext() {
  return {
    reply: vi.fn(),
  };
}

describe("handleMenuAction routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    menuActionMocks.ensureLinkedMock.mockResolvedValue(20);
  });

  it("должен отправлять link actions без проверки привязки", async () => {
    const ctx = createContext();

    await handleMenuAction({ ctx, chatId: 10, action: "link" });
    await handleMenuAction({ ctx, chatId: 10, action: "cancelLink" });

    expect(menuActionMocks.ensureLinkedMock).not.toHaveBeenCalled();
    expect(menuActionMocks.handleLinkMenuActionMock).toHaveBeenNthCalledWith(1, {
      ctx,
      chatId: 10,
      action: "link",
    });
    expect(menuActionMocks.handleLinkMenuActionMock).toHaveBeenNthCalledWith(2, {
      ctx,
      chatId: 10,
      action: "cancelLink",
    });
  });

  it("должен требовать связанный аккаунт для защищенных действий", async () => {
    const ctx = createContext();
    menuActionMocks.ensureLinkedMock.mockResolvedValue(null);

    await handleMenuAction({ ctx, chatId: 10, action: "today" });

    expect(ctx.reply).toHaveBeenCalledWith("Сначала свяжите аккаунт командой /link.", {
      reply_markup: expect.any(Object),
    });
    expect(menuActionMocks.handlePlanMenuActionMock).not.toHaveBeenCalled();
  });

  it("должен маршрутизировать действия плана, веса, расписания и подписки", async () => {
    const ctx = createContext();

    await handleMenuAction({ ctx, chatId: 10, action: "today" });
    await handleMenuAction({ ctx, chatId: 10, action: "date" });
    await handleMenuAction({ ctx, chatId: 10, action: "dailyReport" });
    await handleMenuAction({ ctx, chatId: 10, action: "weight" });
    await handleMenuAction({ ctx, chatId: 10, action: "time" });
    await handleMenuAction({ ctx, chatId: 10, action: "timezone" });
    await handleMenuAction({ ctx, chatId: 10, action: "subscribe" });
    await handleMenuAction({ ctx, chatId: 10, action: "unsubscribe" });

    expect(menuActionMocks.handlePlanMenuActionMock).toHaveBeenCalledTimes(3);
    expect(menuActionMocks.handleWeightMenuActionMock).toHaveBeenCalledWith({ ctx, chatId: 10 });
    expect(menuActionMocks.handleScheduleMenuActionMock).toHaveBeenNthCalledWith(1, {
      ctx,
      chatId: 10,
      action: "time",
      userId: 20,
    });
    expect(menuActionMocks.handleScheduleMenuActionMock).toHaveBeenNthCalledWith(2, {
      ctx,
      chatId: 10,
      action: "timezone",
      userId: 20,
    });
    expect(menuActionMocks.handleSubscriptionMenuActionMock).toHaveBeenNthCalledWith(1, {
      ctx,
      chatId: 10,
      action: "subscribe",
      userId: 20,
    });
    expect(menuActionMocks.handleSubscriptionMenuActionMock).toHaveBeenNthCalledWith(2, {
      ctx,
      chatId: 10,
      action: "unsubscribe",
      userId: 20,
    });
  });

  it("должен маршрутизировать действия удаления связи, помощи и Алисы", async () => {
    const ctx = createContext();

    await handleMenuAction({ ctx, chatId: 10, action: "unlink" });
    await handleMenuAction({ ctx, chatId: 10, action: "help" });
    await handleMenuAction({ ctx, chatId: 10, action: "aliceLink" });
    await handleMenuAction({ ctx, chatId: 10, action: "unknown" });

    expect(menuActionMocks.handleUnlinkMenuActionMock).toHaveBeenCalledWith({ ctx, chatId: 10 });
    expect(menuActionMocks.handleHelpMenuActionMock).toHaveBeenCalledWith({ ctx, userId: 20 });
    expect(menuActionMocks.handleAliceLinkActionMock).toHaveBeenCalledWith({ ctx, userId: 20 });
  });
});
