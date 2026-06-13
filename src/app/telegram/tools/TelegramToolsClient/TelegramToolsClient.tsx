"use client";

import {
  ArrowRightOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import Script from "next/script";
import { useCallback, useEffect, type ReactNode } from "react";
import { TELEGRAM_TOOL_LINKS, TELEGRAM_TOOLS_TEXT } from "./constants/telegramToolsConstants";
import styles from "./TelegramToolsClient.module.scss";

type TelegramWebApp = {
  ready: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const TOOL_ICONS: Record<(typeof TELEGRAM_TOOL_LINKS)[number]["key"], ReactNode> = {
  resultEquivalent: <TrophyOutlined />,
  paceCalculator: <FieldTimeOutlined />,
  speedToPace: <ThunderboltOutlined />,
};

export function TelegramToolsClient() {
  const handleTelegramReady = useCallback(() => {
    const webApp = window.Telegram?.WebApp;

    if (!webApp) {
      return;
    }

    webApp.ready();
    webApp.expand?.();
  }, []);

  useEffect(() => {
    handleTelegramReady();
  }, [handleTelegramReady]);

  return (
    <section className={styles.page}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={handleTelegramReady}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{TELEGRAM_TOOLS_TEXT.title}</h1>
        <p className={styles.subtitle}>{TELEGRAM_TOOLS_TEXT.subtitle}</p>
      </header>

      <div className={styles.toolsList}>
        {TELEGRAM_TOOL_LINKS.map((tool) => (
          <article className={styles.toolCard} key={tool.key}>
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>{TOOL_ICONS[tool.key]}</span>
              <div className={styles.toolText}>
                <h2 className={styles.toolTitle}>{tool.title}</h2>
                <p className={styles.toolDescription}>{tool.description}</p>
              </div>
            </div>
            <Button
              className={styles.toolButton}
              type="primary"
              icon={<ArrowRightOutlined />}
              href={tool.href}
            >
              {TELEGRAM_TOOLS_TEXT.openLabel}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
