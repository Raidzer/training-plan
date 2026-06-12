import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMenuActionByText, resetPendingInput } from "@/bot/commands/handlers/helpers";
import {
  ALICE_LINK_BUTTON_TEXT,
  CANCEL_LINK_BUTTON_TEXT,
  DAILY_REPORT_BUTTON_TEXT,
  DATE_BUTTON_TEXT,
  HELP_BUTTON_TEXT,
  HIDE_MENU_BUTTON_TEXT,
  LINK_BUTTON_TEXT,
  SUBSCRIBE_OFF_BUTTON_TEXT,
  SUBSCRIBE_ON_BUTTON_TEXT,
  TIME_BUTTON_TEXT,
  TIMEZONE_BUTTON_TEXT,
  TODAY_BUTTON_TEXT,
  UNLINK_BUTTON_TEXT,
  WEIGHT_BUTTON_TEXT,
} from "@/bot/menu/menuKeyboard";
import {
  clearPendingInput,
  getPendingInput,
  setPendingInput,
  setRecoveryDraft,
  setWeightDraft,
} from "@/bot/menu/menuState";

describe("bot/commands/handlers/helpers", () => {
  beforeEach(() => {
    clearPendingInput(10);
    vi.clearAllMocks();
  });

  it("должен маппить кнопки меню в действия", () => {
    expect(getMenuActionByText(LINK_BUTTON_TEXT)).toBe("link");
    expect(getMenuActionByText(CANCEL_LINK_BUTTON_TEXT)).toBe("cancelLink");
    expect(getMenuActionByText(TODAY_BUTTON_TEXT)).toBe("today");
    expect(getMenuActionByText(DATE_BUTTON_TEXT)).toBe("date");
    expect(getMenuActionByText(DAILY_REPORT_BUTTON_TEXT)).toBe("dailyReport");
    expect(getMenuActionByText(SUBSCRIBE_ON_BUTTON_TEXT)).toBe("unsubscribe");
    expect(getMenuActionByText(SUBSCRIBE_OFF_BUTTON_TEXT)).toBe("subscribe");
    expect(getMenuActionByText(TIME_BUTTON_TEXT)).toBe("time");
    expect(getMenuActionByText(TIMEZONE_BUTTON_TEXT)).toBe("timezone");
    expect(getMenuActionByText(UNLINK_BUTTON_TEXT)).toBe("unlink");
    expect(getMenuActionByText(WEIGHT_BUTTON_TEXT)).toBe("weight");
    expect(getMenuActionByText(HELP_BUTTON_TEXT)).toBe("help");
    expect(getMenuActionByText(HIDE_MENU_BUTTON_TEXT)).toBe("hideMenu");
    expect(getMenuActionByText(ALICE_LINK_BUTTON_TEXT)).toBe("aliceLink");
  });

  it("должен принимать старые подписи кнопок без иконок", () => {
    expect(getMenuActionByText("Привязать аккаунт")).toBe("link");
    expect(getMenuActionByText("Сегодня")).toBe("today");
    expect(getMenuActionByText("Другая дата")).toBe("date");
    expect(getMenuActionByText("Ежедневный отчет")).toBe("dailyReport");
    expect(getMenuActionByText("Подписка: ВКЛ")).toBe("unsubscribe");
    expect(getMenuActionByText("Подписка: ВЫКЛ")).toBe("subscribe");
    expect(getMenuActionByText("Время рассылки")).toBe("time");
    expect(getMenuActionByText("Часовой пояс")).toBe("timezone");
    expect(getMenuActionByText("Скрыть меню")).toBe("hideMenu");
  });

  it("должен возвращать null для неизвестного текста", () => {
    expect(getMenuActionByText("неизвестно")).toBeNull();
  });

  it("должен сбрасывать pending state для чата", () => {
    setPendingInput(10, "date");
    setRecoveryDraft(10, { hasBath: true, hasMfr: false, hasMassage: false });
    setWeightDraft(10, { date: "2026-06-01" });

    resetPendingInput({ chat: { id: 10 } });

    expect(getPendingInput(10)).toBeNull();
  });

  it("не должен падать при сбросе без чата", () => {
    resetPendingInput({});

    expect(getPendingInput(10)).toBeNull();
  });
});
