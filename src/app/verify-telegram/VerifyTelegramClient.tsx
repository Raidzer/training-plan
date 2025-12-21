"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Typography, message } from "antd";
import styles from "./verify-telegram.module.scss";

type StatusResponse = {
  linked: boolean;
  telegram: {
    username: string | null;
    firstName: string | null;
    linkedAt: string | null;
  } | null;
  subscription: {
    enabled: boolean;
    timezone: string | null;
    sendTime: string | null;
  } | null;
  codeExpiresAt: string | null;
  codeConsumedAt: string | null;
};

type LinkCodeResponse = {
  code: string;
  expiresAt: string;
};

const getApiError = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const error = "error" in value ? (value as { error?: unknown }).error : null;
  return {
    error: typeof error === "string" ? error : undefined,
  };
};

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | null | undefined) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleString() : "н/д";
};

const getTelegramLabel = (status: StatusResponse | null) => {
  if (!status?.telegram) return "Аккаунт не связан";
  if (status.telegram.username) return `@${status.telegram.username}`;
  if (status.telegram.firstName) return status.telegram.firstName;
  return "Связан";
};

export function VerifyTelegramClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<string | null>(null);

  const loadStatus = async (showError = true) => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/telegram/status");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = getApiError(data);
        if (showError) {
          messageApi.error(apiError?.error ?? "Не удалось загрузить статус");
        }
        setStatus(null);
        return;
      }
      setStatus(data as StatusResponse);
    } catch (error) {
      if (showError) messageApi.error("Не удалось загрузить статус");
      console.error(error);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void loadStatus(false);
  }, []);

  const linked = Boolean(status?.linked);
  const telegramLabel = getTelegramLabel(status);

  const subscriptionInfo = useMemo(() => {
    if (!status?.subscription) return "Рассылка не настроена";
    const enabled = status.subscription.enabled ? "включена" : "выключена";
    const time = status.subscription.sendTime ?? "не задано";
    const zone = status.subscription.timezone ?? "не задана";
    return `Рассылка ${enabled}. Время: ${time}. Таймзона: ${zone}.`;
  }, [status?.subscription]);

  const activeCodeInfo = useMemo(() => {
    if (!status?.codeExpiresAt || status.codeConsumedAt) return "";
    const parsed = parseDate(status.codeExpiresAt);
    if (!parsed || parsed.getTime() <= Date.now()) return "";
    return `Последний код действует до ${formatDate(status.codeExpiresAt)}.`;
  }, [status?.codeExpiresAt, status?.codeConsumedAt]);

  const handleIssueCode = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/telegram/link-code", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = getApiError(data);
        if (apiError?.error === "already-linked") {
          messageApi.info("Аккаунт уже связан");
        } else {
          messageApi.error("Не удалось получить код");
        }
        return;
      }
      const payload = data as LinkCodeResponse;
      setIssuedCode(payload.code);
      setIssuedExpiresAt(payload.expiresAt);
      messageApi.success("Код получен");
      await loadStatus(false);
    } catch (error) {
      messageApi.error("Не удалось получить код");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          Связка Telegram
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          Получите код и отправьте его боту командой /link, чтобы связать аккаунт.
        </Typography.Paragraph>

        {loadingStatus ? (
          <Typography.Text>Загрузка...</Typography.Text>
        ) : (
          <>
            <Alert
              type={linked ? "success" : "warning"}
              title={linked ? "Аккаунт связан" : "Аккаунт не связан"}
              description={
                linked
                  ? `Telegram: ${telegramLabel}`
                  : "После связки можно получать тренировки и рассылку."
              }
              showIcon
            />

            {linked && (
              <Typography.Paragraph type="secondary" className={styles.subtitle}>
                {subscriptionInfo}
              </Typography.Paragraph>
            )}

            {!linked && (
              <div className={styles.actions}>
                <Button onClick={handleIssueCode} loading={sending}>
                  Получить код
                </Button>
                <Typography.Text type="secondary">
                  {activeCodeInfo || "Код действует 15 минут. Новый код заменит старый."}
                </Typography.Text>
              </div>
            )}

            {!linked && issuedCode && (
              <Card type="inner" className={styles.codeCard}>
                <Typography.Text>
                  Отправьте боту команду:
                </Typography.Text>
                <Typography.Title level={4} className={styles.code}>
                  /link {issuedCode}
                </Typography.Title>
                <Typography.Text type="secondary">
                  Код действует до {formatDate(issuedExpiresAt)}.
                </Typography.Text>
              </Card>
            )}
          </>
        )}
      </Card>
    </main>
  );
}

