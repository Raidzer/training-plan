import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerToolsCommands } from "@/bot/tools/commands/registerToolsCommands";
import { TOOLS_BOT_MESSAGES } from "@/bot/tools/constants/toolsBotConstants";

type CommandHandler = (ctx: any) => Promise<unknown>;

function createBotHarness() {
  const handlers = new Map<string, CommandHandler>();
  const bot = {
    command: vi.fn((name: string, handler: CommandHandler) => {
      handlers.set(name, handler);
    }),
  };

  registerToolsCommands(bot as any, {
    webAppUrl: "https://swarm-protocol.ru/telegram/tools",
  });

  return handlers;
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

describe("registerToolsCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("регистрирует публичные команды RaceCalcBot", () => {
    const handlers = createBotHarness();

    expect(Array.from(handlers.keys()).sort()).toEqual(["help", "menu", "start"]);
  });

  it("отправляет кнопку открытия Web App в личном чате", async () => {
    const handlers = createBotHarness();
    const ctx = createContext();

    await (handlers.get("start") as CommandHandler)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(TOOLS_BOT_MESSAGES.start, {
      reply_markup: expect.objectContaining({
        keyboard: [
          [
            expect.objectContaining({
              web_app: {
                url: "https://swarm-protocol.ru/telegram/tools",
              },
            }),
          ],
        ],
      }),
    });
  });

  it("просит открыть личный чат для групп", async () => {
    const handlers = createBotHarness();
    const ctx = createContext({
      chat: {
        id: 10,
        type: "group",
      },
    });

    await (handlers.get("help") as CommandHandler)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(TOOLS_BOT_MESSAGES.privateOnly);
  });
});
