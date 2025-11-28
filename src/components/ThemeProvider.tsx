"use client";
import { BulbOutlined, MoonFilled } from "@ant-design/icons";
import { App, ConfigProvider, Switch, theme as antdTheme } from "antd";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

  const bg = mode === "dark" ? "#0f172a" : "#f5f6fb";

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
            style={{
              minHeight: "100vh",
              background: bg,
              transition: "background 0.3s ease",
            }}
          >
            <Header mode={mode} onToggle={(next) => setMode(next)} />
            <main
              style={{
                maxWidth: 980,
                margin: "0 auto",
                padding: "0 16px 48px",
              }}
            >
              {children}
            </main>
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
    <header
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 0.2,
            color: mode === "dark" ? "#f0f4ff" : "#0f172a",
            textDecoration: "none",
          }}
        >
          RunLog
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>
            Тема
          </span>
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
