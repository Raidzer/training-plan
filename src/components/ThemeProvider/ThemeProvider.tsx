"use client";
import { BulbOutlined, MoonFilled } from "@ant-design/icons";
import { App, ConfigProvider, Switch, theme as antdTheme } from "antd";
import Link from "next/link";
import clsx from "clsx";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import styles from "./ThemeProvider.module.scss";

type Mode = "light" | "dark";
type ThemeContextValue = { mode: Mode; setMode: (next: Mode) => void };

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => undefined,
});

const STORAGE_KEY = "ui-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

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
      >
        <App>
          <div
            className={clsx(
              styles.root,
              mode === "dark" ? styles.dark : styles.light
            )}
          >
            <Header mode={mode} onToggle={(next) => setMode(next)} />
            <main className={styles.main}>{children}</main>
          </div>
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

function Header({
  mode,
  onToggle,
}: {
  mode: Mode;
  onToggle: (next: Mode) => void;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          RunLog
        </Link>
        <div className={styles.controls}>
          <span className={styles.themeLabel}>Тема</span>
          <Switch
            checked={mode === "dark"}
            onChange={(checked) => onToggle(checked ? "dark" : "light")}
            checkedChildren={<MoonFilled />}
            unCheckedChildren={<BulbOutlined />}
          />
        </div>
      </div>
    </header>
  );
}

export const useThemeMode = () => useContext(ThemeContext);
