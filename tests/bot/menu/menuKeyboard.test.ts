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
});
