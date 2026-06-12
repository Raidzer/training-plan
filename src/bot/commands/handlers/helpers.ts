import {
  DAILY_REPORT_BUTTON_TEXT,
  ALICE_LINK_BUTTON_TEXT,
  CANCEL_LINK_BUTTON_TEXT,
  DATE_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  HIDE_MENU_BUTTON_TEXT,
  isButtonText,
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

type MenuAction =
  | "link"
  | "cancelLink"
  | "today"
  | "date"
  | "dailyReport"
  | "unsubscribe"
  | "subscribe"
  | "time"
  | "timezone"
  | "unlink"
  | "help"
  | "hideMenu"
  | "weight"
  | "aliceLink";

const MENU_ACTION_BUTTONS: { buttonText: string; action: MenuAction }[] = [
  { buttonText: LINK_BUTTON_TEXT, action: "link" },
  { buttonText: CANCEL_LINK_BUTTON_TEXT, action: "cancelLink" },
  { buttonText: TODAY_BUTTON_TEXT, action: "today" },
  { buttonText: DATE_BUTTON_TEXT, action: "date" },
  { buttonText: DAILY_REPORT_BUTTON_TEXT, action: "dailyReport" },
  { buttonText: SUBSCRIBE_ON_BUTTON_TEXT, action: "unsubscribe" },
  { buttonText: SUBSCRIBE_OFF_BUTTON_TEXT, action: "subscribe" },
  { buttonText: TIME_BUTTON_TEXT, action: "time" },
  { buttonText: TIMEZONE_BUTTON_TEXT, action: "timezone" },
  { buttonText: UNLINK_BUTTON_TEXT, action: "unlink" },
  { buttonText: HELP_BUTTON_TEXT, action: "help" },
  { buttonText: HIDE_MENU_BUTTON_TEXT, action: "hideMenu" },
  { buttonText: WEIGHT_BUTTON_TEXT, action: "weight" },
  { buttonText: ALICE_LINK_BUTTON_TEXT, action: "aliceLink" },
];

export const resetPendingInput = (ctx: { chat?: { id: number } }) => {
  if (ctx.chat) {
    clearPendingInput(ctx.chat.id);
    clearRecoveryDraft(ctx.chat.id);
    clearWeightDraft(ctx.chat.id);
  }
};

export const getMenuActionByText = (text: string) => {
  for (const item of MENU_ACTION_BUTTONS) {
    if (isButtonText(text, item.buttonText)) {
      return item.action;
    }
  }

  return null;
};
