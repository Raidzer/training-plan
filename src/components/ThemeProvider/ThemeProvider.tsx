"use client";
import { App, ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import clsx from "clsx";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./ThemeProvider.module.scss";
import { Header } from "../Header/Header";
import { APP_THEME } from "./themeConfig";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA;
const APP_VERSION_LABEL = APP_VERSION === "dev" ? "dev-сборка" : `версия ${APP_VERSION}`;
const APP_VERSION_TITLE =
  GIT_SHA && GIT_SHA !== "local" ? `${APP_VERSION_LABEL}, сборка ${GIT_SHA}` : undefined;

dayjs.locale("ru");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTelegramRoute = pathname.startsWith("/telegram/");
  const isFullWidthRoute = pathname.startsWith("/tools/templates/");
  const isWideRoute =
    pathname.startsWith("/plan") ||
    pathname.startsWith("/diary") ||
    pathname.startsWith("/profile/records") ||
    pathname.startsWith("/profile/competitions") ||
    pathname.startsWith("/admin") ||
    pathname === "/tools/templates";

  return (
    <ConfigProvider theme={APP_THEME} locale={ruRU}>
      <App>
        <div className={styles.root}>
          <a className={styles.skipLink} href="#main-content">
            Перейти к содержимому
          </a>
          {isTelegramRoute ? null : <Header />}
          <main
            id="main-content"
            className={clsx(
              styles.main,
              isWideRoute && styles.mainWide,
              isFullWidthRoute && styles.mainFull,
              isTelegramRoute && styles.mainTelegram
            )}
          >
            {children}
          </main>
          {isTelegramRoute ? null : (
            <footer className={styles.footer} title={APP_VERSION_TITLE}>
              Сервис бегового клуба СПИРОС · {APP_VERSION_LABEL}
            </footer>
          )}
        </div>
      </App>
    </ConfigProvider>
  );
}
