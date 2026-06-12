import { describe, expect, it } from "vitest";
import {
  buildBackReplyKeyboard,
  buildCancelLinkReplyKeyboard,
  buildDailyReportMenuReplyKeyboard,
  buildDateMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  buildRecoveryReplyKeyboard,
  buildRecoverySleepReplyKeyboard,
  buildTimeReplyKeyboard,
  buildTimezoneReplyKeyboard,
  buildWeightActionReplyKeyboard,
  buildWeightDateReplyKeyboard,
  buildWeightPeriodReplyKeyboard,
  DATE_BACK_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  isButtonText,
  isButtonTextWithValue,
  LINK_BUTTON_TEXT,
  RECOVERY_MFR_LABEL,
  TODAY_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";

describe("bot/menu/menuKeyboard", () => {
  it("создает клавиатуры, которые можно свернуть клиентом Telegram", () => {
    const keyboards = [
      buildMainMenuReplyKeyboard(),
      buildLinkReplyKeyboard(),
      buildCancelLinkReplyKeyboard(),
      buildDateMenuReplyKeyboard({ dateButtons: ["01-06", "02-06", "03-06"] }),
      buildDailyReportMenuReplyKeyboard(),
      buildBackReplyKeyboard(),
      buildTimeReplyKeyboard(),
      buildTimezoneReplyKeyboard(),
      buildWeightDateReplyKeyboard(),
      buildWeightPeriodReplyKeyboard(),
      buildWeightActionReplyKeyboard(),
      buildRecoveryReplyKeyboard({
        sleepText: "",
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
      }),
      buildRecoverySleepReplyKeyboard(),
    ];

    for (const keyboard of keyboards) {
      expect(keyboard).toMatchObject({
        resize_keyboard: true,
        is_persistent: false,
      });
    }
  });

  it("добавляет иконки в основные кнопки меню", () => {
    expect(buildLinkReplyKeyboard().keyboard[0][0].text).toBe(LINK_BUTTON_TEXT);
    expect(buildMainMenuReplyKeyboard().keyboard[0][0].text).toBe(TODAY_BUTTON_TEXT);
    expect(buildMainMenuReplyKeyboard().keyboard[5][1].text).toBe(HELP_BUTTON_TEXT);
    expect(LINK_BUTTON_TEXT).toContain("🔗");
    expect(TODAY_BUTTON_TEXT).toContain("📅");
    expect(HELP_BUTTON_TEXT).toContain("❔");
  });

  it("сравнивает новые и старые подписи кнопок без учета иконки", () => {
    expect(isButtonText("Назад", DATE_BACK_BUTTON_TEXT)).toBe(true);
    expect(isButtonText("📅 Сегодня", TODAY_BUTTON_TEXT)).toBe(true);
    expect(isButtonTextWithValue("МФР: нет", RECOVERY_MFR_LABEL)).toBe(true);
    expect(isButtonTextWithValue(`${RECOVERY_MFR_LABEL}: нет`, RECOVERY_MFR_LABEL)).toBe(true);
  });
});
