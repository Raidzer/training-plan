export const LINK_BUTTON_TEXT = "Привязать аккаунт";
export const CANCEL_LINK_BUTTON_TEXT = "Отменить привязку";
export const TODAY_BUTTON_TEXT = "Сегодня";
export const DATE_BUTTON_TEXT = "Другая дата";
export const CUSTOM_DATE_BUTTON_TEXT = "Указать дату";
export const DATE_BACK_BUTTON_TEXT = "Назад";
export const SUBSCRIBE_ON_BUTTON_TEXT = "Подписка: ВКЛ";
export const SUBSCRIBE_OFF_BUTTON_TEXT = "Подписка: ВЫКЛ";
export const TIME_BUTTON_TEXT = "Время рассылки";
export const TIMEZONE_BUTTON_TEXT = "Часовой пояс";
export const UNLINK_BUTTON_TEXT = "Отвязать";
export const HELP_BUTTON_TEXT = "Помощь";
export const WEIGHT_BUTTON_TEXT = "Заполнить дневник";
export const WEIGHT_TODAY_BUTTON_TEXT = "Сегодня";
export const WEIGHT_CUSTOM_DATE_BUTTON_TEXT = "Произвольная дата";
export const REPORT_WEIGHT_BUTTON_TEXT = "Указать вес";
export const REPORT_RECOVERY_BUTTON_TEXT = "Сон и восстановление";
export const REPORT_MAIN_MENU_BUTTON_TEXT = "Главное меню";
export const WEIGHT_MORNING_BUTTON_TEXT = "Указать утренний вес";
export const WEIGHT_EVENING_BUTTON_TEXT = "Указать вечерний вес";
export const RECOVERY_SLEEP_LABEL = "Сон";
export const RECOVERY_MFR_LABEL = "МФР";
export const RECOVERY_MASSAGE_LABEL = "Массаж";
export const RECOVERY_BATH_LABEL = "Баня";
export const RECOVERY_SAVE_BUTTON_TEXT = "Сохранить";

export const ALICE_LINK_BUTTON_TEXT = "Связать с Алисой";

export const buildMainMenuReplyKeyboard = (params?: { subscribed?: boolean }) => {
  const subscribed = params?.subscribed ?? false;
  return {
    keyboard: [
      [{ text: TODAY_BUTTON_TEXT }, { text: DATE_BUTTON_TEXT }],
      [{ text: WEIGHT_BUTTON_TEXT }],
      [
        {
          text: subscribed ? SUBSCRIBE_ON_BUTTON_TEXT : SUBSCRIBE_OFF_BUTTON_TEXT,
        },
      ],
      [{ text: TIME_BUTTON_TEXT }, { text: TIMEZONE_BUTTON_TEXT }],
      [{ text: UNLINK_BUTTON_TEXT }, { text: HELP_BUTTON_TEXT }],
      [{ text: ALICE_LINK_BUTTON_TEXT }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
};

export const buildLinkReplyKeyboard = () => {
  return {
    keyboard: [[{ text: LINK_BUTTON_TEXT }]],
    resize_keyboard: true,
    is_persistent: true,
  };
};

export const buildCancelLinkReplyKeyboard = () => {
  return {
    keyboard: [[{ text: CANCEL_LINK_BUTTON_TEXT }]],
    resize_keyboard: true,
    is_persistent: true,
  };
};

export const buildDateMenuReplyKeyboard = (params: { dateButtons: string[] }) => {
  const rows: { text: string }[][] = [];
  for (let i = 0; i < params.dateButtons.length; i += 2) {
    const row = [{ text: params.dateButtons[i] }];
    if (params.dateButtons[i + 1]) {
      row.push({ text: params.dateButtons[i + 1] });
    }
    rows.push(row);
  }
  rows.push([{ text: CUSTOM_DATE_BUTTON_TEXT }, { text: DATE_BACK_BUTTON_TEXT }]);
  return {
    keyboard: rows,
    resize_keyboard: true,
    is_persistent: true,
  };
};

export const buildWeightDateReplyKeyboard = () => {
  return {
    keyboard: [
      [{ text: WEIGHT_TODAY_BUTTON_TEXT }, { text: WEIGHT_CUSTOM_DATE_BUTTON_TEXT }],
      [{ text: DATE_BACK_BUTTON_TEXT }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
};

export const buildWeightPeriodReplyKeyboard = () => {
  return {
    keyboard: [
      [{ text: WEIGHT_MORNING_BUTTON_TEXT }, { text: WEIGHT_EVENING_BUTTON_TEXT }],
      [{ text: DATE_BACK_BUTTON_TEXT }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
};

export const buildWeightActionReplyKeyboard = () => {
  return {
    keyboard: [
      [{ text: REPORT_WEIGHT_BUTTON_TEXT }],
      [{ text: REPORT_RECOVERY_BUTTON_TEXT }],
      [{ text: REPORT_MAIN_MENU_BUTTON_TEXT }, { text: DATE_BACK_BUTTON_TEXT }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
};

const formatRecoveryToggleLabel = (label: string, enabled: boolean) => {
  return `${label}: ${enabled ? "да" : "нет"}`;
};

const formatRecoverySleepLabel = (sleepText: string) => {
  const displayValue = sleepText.trim().length > 0 ? sleepText : "-";
  return `${RECOVERY_SLEEP_LABEL}: ${displayValue}`;
};

export const buildRecoveryReplyKeyboard = (params: {
  sleepText: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
}) => {
  return {
    keyboard: [
      [{ text: formatRecoverySleepLabel(params.sleepText) }],
      [
        {
          text: formatRecoveryToggleLabel(RECOVERY_MFR_LABEL, params.hasMfr),
        },
        {
          text: formatRecoveryToggleLabel(RECOVERY_MASSAGE_LABEL, params.hasMassage),
        },
      ],
      [
        {
          text: formatRecoveryToggleLabel(RECOVERY_BATH_LABEL, params.hasBath),
        },
      ],
      [{ text: RECOVERY_SAVE_BUTTON_TEXT }],
      [{ text: REPORT_MAIN_MENU_BUTTON_TEXT }, { text: DATE_BACK_BUTTON_TEXT }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
};
