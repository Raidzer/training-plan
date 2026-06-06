"use client";

import { Card } from "antd";
import { TelegramLinkPanel } from "@/components/TelegramLinkPanel/TelegramLinkPanel";
import styles from "./VerifyTelegramClient.module.scss";

export function VerifyTelegramClient() {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <TelegramLinkPanel />
      </Card>
    </main>
  );
}
