"use client";
import { App, ConfigProvider, theme as antdTheme } from "antd";
import ruRU from "antd/locale/ru_RU";
import clsx from "clsx";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import styles from "./ThemeProvider.module.scss";
import { Header } from "../Header/Header";

export type Mode = "light" | "dark";
type ThemeContextValue = { mode: Mode; setMode: (next: Mode) => void };

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => undefined,
});

const STORAGE_KEY = "ui-theme";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA;
const APP_VERSION_TITLE =
  GIT_SHA && GIT_SHA !== "local" ? `Версия ${APP_VERSION}, сборка ${GIT_SHA}` : undefined;

dayjs.locale("ru");

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialTheme);
  const pathname = usePathname();
  const isFullWidthRoute = pathname.startsWith("/tools/templates/");
  const isWideRoute =
    pathname.startsWith("/plan") ||
    pathname.startsWith("/diary") ||
    pathname === "/tools/templates";

  const handleSetMode = (next: Mode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);

    // Set cookie for 1 year
    document.cookie = `ui-theme=${next}; path=/; max-age=31536000; SameSite=Lax`;

    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const algorithm = useMemo(
    () => (mode === "dark" ? [antdTheme.darkAlgorithm] : [antdTheme.defaultAlgorithm]),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, setMode: handleSetMode }}>
      <ConfigProvider
        theme={{
          algorithm,
          token: {
            colorPrimary: mode === "dark" ? "#6ea8ff" : "#3056d3",
            borderRadius: 10,
          },
        }}
        locale={ruRU}
      >
        <App>
          <div className={styles.root}>
            <Header mode={mode} onToggle={handleSetMode} />
            <main
              className={clsx(
                styles.main,
                isWideRoute && styles.mainWide,
                isFullWidthRoute && styles.mainFull
              )}
            >
              {children}
            </main>
            <footer className={styles.footer} title={APP_VERSION_TITLE}>
              v{APP_VERSION}
            </footer>
          </div>
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);
