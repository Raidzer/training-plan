export const LINK_BUTTON_TEXT = "Привязать аккаунт";
export const CANCEL_LINK_BUTTON_TEXT = "Отменить привязку";
export const TODAY_BUTTON_TEXT = "Сегодня";
export const DATE_BUTTON_TEXT = "Дата";
export const SUBSCRIBE_ON_BUTTON_TEXT = "Подписка: ВКЛ";
export const SUBSCRIBE_OFF_BUTTON_TEXT = "Подписка: ВЫКЛ";
export const TIME_BUTTON_TEXT = "Время рассылки";
export const TIMEZONE_BUTTON_TEXT = "Таймзона";
export const UNLINK_BUTTON_TEXT = "Отвязать";
export const HELP_BUTTON_TEXT = "Помощь";

export const buildMainMenuReplyKeyboard = (params?: { subscribed?: boolean }) => {
  const subscribed = params?.subscribed ?? false;
  return {
    keyboard: [
      [{ text: TODAY_BUTTON_TEXT }, { text: DATE_BUTTON_TEXT }],
      [
        {
          text: subscribed ? SUBSCRIBE_ON_BUTTON_TEXT : SUBSCRIBE_OFF_BUTTON_TEXT,
        },
      ],
      [{ text: TIME_BUTTON_TEXT }, { text: TIMEZONE_BUTTON_TEXT }],
      [{ text: UNLINK_BUTTON_TEXT }, { text: HELP_BUTTON_TEXT }],
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
