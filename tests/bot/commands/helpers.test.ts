import { describe, expect, it } from "vitest";
import { getMenuActionByText } from "@/bot/commands/handlers/helpers";
import {
  DAILY_REPORT_BUTTON_TEXT,
  DATE_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  TODAY_BUTTON_TEXT,
  WEIGHT_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";

describe("bot/commands/handlers/helpers", () => {
  it("должен маппить кнопки меню в действия", () => {
    expect(getMenuActionByText(TODAY_BUTTON_TEXT)).toBe("today");
    expect(getMenuActionByText(DATE_BUTTON_TEXT)).toBe("date");
    expect(getMenuActionByText(DAILY_REPORT_BUTTON_TEXT)).toBe("dailyReport");
    expect(getMenuActionByText(WEIGHT_BUTTON_TEXT)).toBe("weight");
    expect(getMenuActionByText(HELP_BUTTON_TEXT)).toBe("help");
  });

  it("должен возвращать null для неизвестного текста", () => {
    expect(getMenuActionByText("неизвестно")).toBeNull();
  });
});
