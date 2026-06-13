import { describe, expect, it } from "vitest";
import { OPEN_TOOLS_BUTTON_TEXT } from "@/bot/tools/constants/toolsBotConstants";
import { buildToolsWebAppReplyKeyboard } from "@/bot/tools/keyboards/toolsKeyboard";

describe("bot/tools/toolsKeyboard", () => {
  it("создает клавиатуру с Web App кнопкой", () => {
    expect(buildToolsWebAppReplyKeyboard("https://swarm-protocol.ru/telegram/tools")).toEqual({
      keyboard: [
        [
          {
            text: OPEN_TOOLS_BUTTON_TEXT,
            web_app: {
              url: "https://swarm-protocol.ru/telegram/tools",
            },
          },
        ],
      ],
      resize_keyboard: true,
      is_persistent: false,
    });
  });
});
