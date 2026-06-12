"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, Switch, Typography, message } from "antd";
import styles from "./TelegramLinkPanel.module.scss";

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

type SubscriptionUpdateResponse = {
  success: boolean;
  subscription: NonNullable<StatusResponse["subscription"]>;
};

const DEFAULT_SEND_TIME = "07:30";
const SEND_TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const getApiError = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const error = "error" in value ? (value as { error?: unknown }).error : null;
  return {
    error: typeof error === "string" ? error : undefined,
  };
};

const parseDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | null | undefined) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleString() : "н/д";
};

const getTelegramLabel = (status: StatusResponse | null) => {
  if (!status?.telegram) {
    return "Аккаунт не связан";
  }
  if (status.telegram.username) {
    return `@${status.telegram.username}`;
  }
  if (status.telegram.firstName) {
    return status.telegram.firstName;
  }
  return "Связан";
};

const normalizeStatus = (status: StatusResponse) => {
  const parsedCodeExpiresAt = parseDate(status.codeExpiresAt);
  if (!status.codeExpiresAt || status.codeConsumedAt || !parsedCodeExpiresAt) {
    return {
      ...status,
      codeExpiresAt: null,
    };
  }
  if (parsedCodeExpiresAt.getTime() <= Date.now()) {
    return {
      ...status,
      codeExpiresAt: null,
    };
  }
  return status;
};

export function TelegramLinkPanel() {
  const [messageApi, contextHolder] = message.useMessage();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<string | null>(null);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [sendTime, setSendTime] = useState(DEFAULT_SEND_TIME);

  const applyStatus = useCallback((nextStatus: StatusResponse) => {
    const normalizedStatus = normalizeStatus(nextStatus);
    setStatus(normalizedStatus);
    setSubscriptionEnabled(normalizedStatus.subscription?.enabled ?? false);
    setSendTime(normalizedStatus.subscription?.sendTime ?? DEFAULT_SEND_TIME);
  }, []);

  const loadStatus = useCallback(
    async (showError = true) => {
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
        applyStatus(data as StatusResponse);
      } catch (error) {
        if (showError) {
          messageApi.error("Не удалось загрузить статус");
        }
        console.error(error);
      } finally {
        setLoadingStatus(false);
      }
    },
    [applyStatus, messageApi]
  );

  useEffect(() => {
    let active = true;
    fetch("/api/telegram/status")
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!active) {
          return;
        }
        if (!res.ok) {
          setStatus(null);
          return;
        }
        applyStatus(data as StatusResponse);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
      })
      .finally(() => {
        if (active) {
          setLoadingStatus(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyStatus]);

  const linked = Boolean(status?.linked);
  const telegramLabel = getTelegramLabel(status);

  const subscriptionInfo = useMemo(() => {
    if (!status?.subscription) {
      return "Рассылка не настроена";
    }
    const enabled = status.subscription.enabled ? "включена" : "выключена";
    const time = status.subscription.sendTime ?? "не задано";
    const zone = status.subscription.timezone ?? "не задана";
    return `Рассылка ${enabled}. Время: ${time}. Таймзона: ${zone}.`;
  }, [status?.subscription]);

  const activeCodeInfo = useMemo(() => {
    if (!status?.codeExpiresAt || status.codeConsumedAt) {
      return "";
    }
    return `Последний код действует до ${formatDate(status.codeExpiresAt)}.`;
  }, [status]);

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

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const res = await fetch("/api/telegram/unlink", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = getApiError(data);
        messageApi.error(apiError?.error ?? "Не удалось отвязать Telegram");
        return;
      }
      messageApi.success("Telegram отвязан");
      setIssuedCode(null);
      setIssuedExpiresAt(null);
      await loadStatus(false);
    } catch (error) {
      messageApi.error("Не удалось отвязать Telegram");
      console.error(error);
    } finally {
      setUnlinking(false);
    }
  };

  const handleSubscriptionSave = async () => {
    if (subscriptionEnabled && !SEND_TIME_REGEX.test(sendTime)) {
      messageApi.error("Укажите время рассылки в формате HH:MM");
      return;
    }

    setSavingSubscription(true);
    try {
      const res = await fetch("/api/telegram/subscription", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: subscriptionEnabled,
          sendTime: sendTime || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = getApiError(data);
        messageApi.error(apiError?.error ?? "Не удалось сохранить настройки рассылки");
        return;
      }

      const payload = data as SubscriptionUpdateResponse;
      setSubscriptionEnabled(payload.subscription.enabled);
      setSendTime(payload.subscription.sendTime ?? DEFAULT_SEND_TIME);
      setStatus((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          subscription: payload.subscription,
        };
      });
      messageApi.success("Настройки рассылки сохранены");
    } catch (error) {
      messageApi.error("Не удалось сохранить настройки рассылки");
      console.error(error);
    } finally {
      setSavingSubscription(false);
    }
  };

  return (
    <section className={styles.panel}>
      {contextHolder}
      <Typography.Title level={4} className={styles.title}>
        Telegram
      </Typography.Title>
      <Typography.Paragraph type="secondary" className={styles.subtitle}>
        Получите код, нажмите в боте «Привязать аккаунт» и отправьте код сообщением.
      </Typography.Paragraph>

      {loadingStatus ? (
        <Typography.Text>Загрузка...</Typography.Text>
      ) : (
        <>
          <Alert
            type={linked ? "success" : "warning"}
            title={linked ? "Аккаунт связан" : "Аккаунт не связан"}
            description={
              linked ? `Telegram: ${telegramLabel}` : "После связки можно получать план и рассылку."
            }
            showIcon
          />

          {linked && (
            <>
              <Typography.Paragraph type="secondary" className={styles.subtitle}>
                {subscriptionInfo}
              </Typography.Paragraph>
              <div className={styles.subscriptionSettings}>
                <div className={styles.settingRow}>
                  <Typography.Text>Подписка на рассылку</Typography.Text>
                  <Switch
                    checked={subscriptionEnabled}
                    onChange={(checked) => {
                      setSubscriptionEnabled(checked);
                    }}
                    aria-label="Подписка на рассылку"
                  />
                </div>
                <label className={styles.timeField}>
                  <Typography.Text>Время рассылки</Typography.Text>
                  <Input
                    aria-label="Время рассылки"
                    type="time"
                    value={sendTime}
                    onChange={(event) => {
                      setSendTime(event.target.value);
                    }}
                    status={subscriptionEnabled && !SEND_TIME_REGEX.test(sendTime) ? "error" : ""}
                  />
                </label>
                <Button
                  type="primary"
                  onClick={handleSubscriptionSave}
                  loading={savingSubscription}
                >
                  Сохранить настройки рассылки
                </Button>
              </div>
              <div className={styles.actions}>
                <Button danger onClick={handleUnlink} loading={unlinking}>
                  Отвязать Telegram
                </Button>
                <Typography.Text type="secondary">
                  При отвязке рассылка отключится. Можно будет связать другой аккаунт.
                </Typography.Text>
              </div>
            </>
          )}

          {!linked && (
            <div className={styles.actions}>
              <Button aria-label="Получить код" onClick={handleIssueCode} loading={sending}>
                Получить код
              </Button>
              <Typography.Text type="secondary">
                {activeCodeInfo || "Код действует 15 минут. Новый код заменит старый."}
              </Typography.Text>
            </div>
          )}

          {!linked && issuedCode && (
            <Card type="inner" className={styles.codeCard}>
              <Typography.Text>Отправьте боту код:</Typography.Text>
              <Typography.Title level={4} className={styles.code}>
                {issuedCode}
              </Typography.Title>
              <Typography.Text type="secondary">
                Код действует до {formatDate(issuedExpiresAt)}.
              </Typography.Text>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
