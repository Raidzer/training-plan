"use client";

import { AppstoreOutlined, BulbOutlined, MoonFilled } from "@ant-design/icons";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeMode } from "@/components/ThemeProvider/ThemeProvider";
import { TELEGRAM_TOOL_LINKS, TELEGRAM_TOOLS_TEXT } from "../../constants/telegramToolsConstants";
import styles from "./TelegramToolsNavigation.module.scss";

const TOOLS_INDEX_HREF = "/telegram/tools";

export function TelegramToolsNavigation() {
  const pathname = usePathname();
  const { mode, setMode } = useThemeMode();
  const isDarkMode = mode === "dark";
  const themeButtonLabel = isDarkMode
    ? TELEGRAM_TOOLS_TEXT.enableLightThemeLabel
    : TELEGRAM_TOOLS_TEXT.enableDarkThemeLabel;

  const handleThemeToggle = () => {
    setMode(isDarkMode ? "light" : "dark");
  };

  return (
    <nav className={styles.navigation} aria-label={TELEGRAM_TOOLS_TEXT.navigationLabel}>
      <Link
        className={clsx(styles.allToolsLink, pathname === TOOLS_INDEX_HREF && styles.active)}
        href={TOOLS_INDEX_HREF}
        aria-current={pathname === TOOLS_INDEX_HREF ? "page" : undefined}
      >
        <AppstoreOutlined aria-hidden="true" />
        <span>{TELEGRAM_TOOLS_TEXT.allToolsLabel}</span>
      </Link>

      <div className={styles.tabs}>
        {TELEGRAM_TOOL_LINKS.map((tool) => {
          const isActive = pathname === tool.href;

          return (
            <Link
              className={clsx(styles.tabLink, isActive && styles.active)}
              href={tool.href}
              aria-current={isActive ? "page" : undefined}
              key={tool.key}
            >
              {tool.shortTitle}
            </Link>
          );
        })}
      </div>

      <button
        className={styles.themeButton}
        type="button"
        aria-label={themeButtonLabel}
        title={themeButtonLabel}
        onClick={handleThemeToggle}
      >
        {isDarkMode ? <BulbOutlined aria-hidden="true" /> : <MoonFilled aria-hidden="true" />}
      </button>
    </nav>
  );
}
