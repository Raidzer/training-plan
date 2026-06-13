import { describe, expect, it } from "vitest";
import { buildToolsWebAppUrl } from "@/bot/tools/utils/toolsBotUrl";

describe("bot/tools/toolsBotUrl", () => {
  it("собирает URL Telegram Web App от NEXTAUTH_URL", () => {
    expect(buildToolsWebAppUrl("https://swarm-protocol.ru/")).toBe(
      "https://swarm-protocol.ru/telegram/tools"
    );
    expect(buildToolsWebAppUrl("https://swarm-protocol.ru")).toBe(
      "https://swarm-protocol.ru/telegram/tools"
    );
  });

  it("требует базовый URL приложения", () => {
    expect(() => buildToolsWebAppUrl("")).toThrow("NEXTAUTH_URL не задан");
  });
});
