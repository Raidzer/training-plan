import { TOOLS_WEB_APP_PATH } from "@/bot/tools/constants/toolsBotConstants";

export function buildToolsWebAppUrl(baseUrl = process.env.NEXTAUTH_URL) {
  const normalizedBaseUrl = baseUrl?.trim();

  if (!normalizedBaseUrl) {
    throw new Error("NEXTAUTH_URL не задан");
  }

  return new URL(TOOLS_WEB_APP_PATH, normalizedBaseUrl).toString();
}
