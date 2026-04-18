import {
  DAILY_REPORT_BUTTON_TEXT,
  ALICE_LINK_BUTTON_TEXT,
  CANCEL_LINK_BUTTON_TEXT,
  DATE_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  LINK_BUTTON_TEXT,
  SUBSCRIBE_OFF_BUTTON_TEXT,
  SUBSCRIBE_ON_BUTTON_TEXT,
  TIME_BUTTON_TEXT,
  TIMEZONE_BUTTON_TEXT,
  TODAY_BUTTON_TEXT,
  UNLINK_BUTTON_TEXT,
  WEIGHT_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import { clearPendingInput, clearRecoveryDraft, clearWeightDraft } from "@/bot/menu/menuState";

export const resetPendingInput = (ctx: { chat?: { id: number } }) => {
  if (ctx.chat) {
    clearPendingInput(ctx.chat.id);
    clearRecoveryDraft(ctx.chat.id);
    clearWeightDraft(ctx.chat.id);
  }
};

export const getMenuActionByText = (text: string) => {
  switch (text) {
    case LINK_BUTTON_TEXT:
      return "link";
    case CANCEL_LINK_BUTTON_TEXT:
      return "cancelLink";
    case TODAY_BUTTON_TEXT:
      return "today";
    case DATE_BUTTON_TEXT:
      return "date";
    case DAILY_REPORT_BUTTON_TEXT:
      return "dailyReport";
    case SUBSCRIBE_ON_BUTTON_TEXT:
      return "unsubscribe";
    case SUBSCRIBE_OFF_BUTTON_TEXT:
      return "subscribe";
    case TIME_BUTTON_TEXT:
      return "time";
    case TIMEZONE_BUTTON_TEXT:
      return "timezone";
    case UNLINK_BUTTON_TEXT:
      return "unlink";
    case HELP_BUTTON_TEXT:
      return "help";
    case WEIGHT_BUTTON_TEXT:
      return "weight";
    case ALICE_LINK_BUTTON_TEXT:
      return "aliceLink";
    default:
      return null;
  }
};
