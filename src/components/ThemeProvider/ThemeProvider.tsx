"use client";
import { App, ConfigProvider, theme as antdTheme } from "antd";
import ruRU from "antd/locale/ru_RU";
import clsx from "clsx";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import styles from "./ThemeProvider.module.scss";
import { Header } from "../Header/Header";

export type Mode = "light" | "dark";
type ThemeContextValue = { mode: Mode; setMode: (next: Mode) => void };

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => undefined,
});

const STORAGE_KEY = "ui-theme";
dayjs.locale("ru");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");
  const pathname = usePathname();
  const isPlanRoute = pathname.startsWith("/plan");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setMode(saved);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const algorithm = useMemo(
    () =>
      mode === "dark"
        ? [antdTheme.darkAlgorithm]
        : [antdTheme.defaultAlgorithm],
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
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
          <div
            className={clsx(
              styles.root,
              mode === "dark" ? styles.dark : styles.light
            )}
          >
            <Header mode={mode} onToggle={(next) => setMode(next)} />
            <main
              className={clsx(styles.main, isPlanRoute && styles.mainWide)}
            >
              {children}
            </main>
          </div>
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);
