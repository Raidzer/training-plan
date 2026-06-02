import { describe, expect, it, vi } from "vitest";

const { ensureLinkedMock } = vi.hoisted(() => ({
  ensureLinkedMock: vi.fn(),
}));

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: ensureLinkedMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleAliceLinkAction", () => ({
  handleAliceLinkAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleHelpAction", () => ({
  handleHelpMenuAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleLinkAction", () => ({
  handleLinkMenuAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handlePlanAction", () => ({
  handlePlanMenuAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleScheduleAction", () => ({
  handleScheduleMenuAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleSubscriptionAction", () => ({
  handleSubscriptionMenuAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleUnlinkAction", () => ({
  handleUnlinkMenuAction: vi.fn(),
}));

vi.mock("@/bot/commands/handlers/textMessage/menu/handleWeightAction", () => ({
  handleWeightMenuAction: vi.fn(),
}));

import { handleMenuAction } from "@/bot/commands/handlers/textMessage/handleMenuAction";

describe("hide menu action", () => {
  it("должен скрывать reply keyboard без проверки привязки аккаунта", async () => {
    const ctx = {
      reply: vi.fn(),
    };

    await handleMenuAction({ ctx, chatId: 10, action: "hideMenu" });

    expect(ctx.reply).toHaveBeenCalledWith("Меню скрыто. Чтобы вернуть его, отправьте /menu.", {
      reply_markup: { remove_keyboard: true },
    });
    expect(ensureLinkedMock).not.toHaveBeenCalled();
  });
});
