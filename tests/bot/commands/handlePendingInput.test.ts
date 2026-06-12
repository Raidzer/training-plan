import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PendingInput } from "@/bot/menu/menuState";

const pendingMocks = vi.hoisted(() => ({
  clearPendingInputMock: vi.fn(),
  ensureLinkedMock: vi.fn(),
  handleCancelIfRequestedMock: vi.fn(),
  handleDailyReportPendingMock: vi.fn(),
  handleDatePendingMock: vi.fn(),
  handleLinkPendingMock: vi.fn(),
  handleRecoveryPendingMock: vi.fn(),
  handleSchedulePendingMock: vi.fn(),
  handleWeightPendingMock: vi.fn(),
}));

vi.mock("@/bot/menu/menuState", async () => {
  const actual =
    await vi.importActual<typeof import("@/bot/menu/menuState")>("@/bot/menu/menuState");

  return {
    ...actual,
    clearPendingInput: pendingMocks.clearPendingInputMock,
  };
});

vi.mock("@/bot/services/telegramAccounts", () => ({
  ensureLinked: pendingMocks.ensureLinkedMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleCancel", () => ({
  handleCancelIfRequested: pendingMocks.handleCancelIfRequestedMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleDailyReport", () => ({
  handleDailyReportPending: pendingMocks.handleDailyReportPendingMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleDate", () => ({
  handleDatePending: pendingMocks.handleDatePendingMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleLink", () => ({
  handleLinkPending: pendingMocks.handleLinkPendingMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleRecovery", () => ({
  handleRecoveryPending: pendingMocks.handleRecoveryPendingMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleSchedule", () => ({
  handleSchedulePending: pendingMocks.handleSchedulePendingMock,
}));

vi.mock("@/bot/commands/handlers/textMessage/pending/handleWeight", () => ({
  handleWeightPending: pendingMocks.handleWeightPendingMock,
}));

import { handlePendingInput } from "@/bot/commands/handlers/textMessage/handlePendingInput";

function createContext() {
  return {
    reply: vi.fn(),
  };
}

async function runPending(pending: PendingInput, text = "input") {
  const ctx = createContext();

  await handlePendingInput({
    ctx,
    chatId: 10,
    text,
    pending,
  });

  return ctx;
}

describe("handlePendingInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingMocks.ensureLinkedMock.mockResolvedValue(20);
    pendingMocks.handleCancelIfRequestedMock.mockResolvedValue(false);
  });

  it("stops dispatch when cancel handler consumes input", async () => {
    pendingMocks.handleCancelIfRequestedMock.mockResolvedValue(true);

    await runPending("dateMenu", "отмена");

    expect(pendingMocks.handleCancelIfRequestedMock).toHaveBeenCalledWith({
      ctx: expect.any(Object),
      chatId: 10,
      text: "отмена",
      pending: "dateMenu",
    });
    expect(pendingMocks.ensureLinkedMock).not.toHaveBeenCalled();
    expect(pendingMocks.handleDatePendingMock).not.toHaveBeenCalled();
  });

  it("routes link pending without requiring linked Telegram account", async () => {
    await runPending("link", "123456");

    expect(pendingMocks.handleLinkPendingMock).toHaveBeenCalledWith({
      ctx: expect.any(Object),
      chatId: 10,
      text: "123456",
    });
    expect(pendingMocks.ensureLinkedMock).not.toHaveBeenCalled();
  });

  it("clears pending input and asks to link account when user is not linked", async () => {
    pendingMocks.ensureLinkedMock.mockResolvedValue(null);

    const ctx = await runPending("dateMenu");

    expect(pendingMocks.clearPendingInputMock).toHaveBeenCalledWith(10);
    expect(ctx.reply).toHaveBeenCalledWith(
      "Сначала свяжите аккаунт кнопкой ниже.",
      expect.objectContaining({ reply_markup: expect.any(Object) })
    );
    expect(pendingMocks.handleDatePendingMock).not.toHaveBeenCalled();
  });

  it.each([
    ["date", "handleDatePendingMock"],
    ["dailyReportDate", "handleDailyReportPendingMock"],
    ["weightValue", "handleWeightPendingMock"],
    ["recoverySleep", "handleRecoveryPendingMock"],
    ["timezone", "handleSchedulePendingMock"],
  ] as const)("routes %s pending to the matching handler", async (pending, handlerName) => {
    await runPending(pending, "value");

    expect(pendingMocks[handlerName]).toHaveBeenCalledWith({
      ctx: expect.any(Object),
      chatId: 10,
      text: "value",
      pending,
      userId: 20,
    });
  });
});
