import { OPEN_TOOLS_BUTTON_TEXT } from "@/bot/tools/constants/toolsBotConstants";

export const buildToolsWebAppReplyKeyboard = (webAppUrl: string) => {
  return {
    keyboard: [
      [
        {
          text: OPEN_TOOLS_BUTTON_TEXT,
          web_app: {
            url: webAppUrl,
          },
        },
      ],
    ],
    resize_keyboard: true,
    is_persistent: false,
  };
};
