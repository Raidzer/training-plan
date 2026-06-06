import { describe, expect, it } from "vitest";
import {
  buildCancelLinkReplyKeyboard,
  buildCancelReplyKeyboard,
  buildDailyReportMenuReplyKeyboard,
  buildDateMenuReplyKeyboard,
  buildLinkReplyKeyboard,
  buildMainMenuReplyKeyboard,
  buildRecoveryReplyKeyboard,
  buildWeightActionReplyKeyboard,
  buildWeightDateReplyKeyboard,
  buildWeightPeriodReplyKeyboard,
} from "@/bot/menu/menuKeyboard";

describe("bot/menu/menuKeyboard", () => {
  it("создает клавиатуры, которые можно свернуть клиентом Telegram", () => {
    const keyboards = [
      buildMainMenuReplyKeyboard(),
      buildLinkReplyKeyboard(),
      buildCancelLinkReplyKeyboard(),
      buildDateMenuReplyKeyboard({ dateButtons: ["01-06", "02-06", "03-06"] }),
      buildDailyReportMenuReplyKeyboard(),
      buildCancelReplyKeyboard(),
      buildWeightDateReplyKeyboard(),
      buildWeightPeriodReplyKeyboard(),
      buildWeightActionReplyKeyboard(),
      buildRecoveryReplyKeyboard({
        sleepText: "",
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
      }),
    ];

    for (const keyboard of keyboards) {
      expect(keyboard).toMatchObject({
        resize_keyboard: true,
        is_persistent: false,
      });
    }
  });
});
