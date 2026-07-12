"use client";

import { ExportOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, Switch, Typography, message } from "antd";
import styles from "./TelegramLinkPanel.module.scss";

type StatusResponse = {
  linked: boolean;
  botUrl: string | null;
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
  linkUrl: string | null;
  expiresAt: string;
};

type SubscriptionUpdateResponse = {
  success: boolean;
  subscription: NonNullable<StatusResponse["subscription"]>;
};

const DEFAULT_SEND_TIME = "07:30";
const SEND_TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const STATUS_ERROR_TITLE = "Не удалось загрузить статус Telegram";
const STATUS_ERROR_DESCRIPTION = "Проверьте соединение и повторите загрузку.";

type TelegramLinkPanelProps = {
  showHeader?: boolean;
};

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

export function TelegramLinkPanel({ showHeader = true }: TelegramLinkPanelProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedLinkUrl, setIssuedLinkUrl] = useState<string | null>(null);
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<string | null>(null);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [sendTime, setSendTime] = useState(DEFAULT_SEND_TIME);

  const applyStatus = useCallback((nextStatus: StatusResponse) => {
    const normalizedStatus = normalizeStatus(nextStatus);
    setStatusError(false);
    setStatus(normalizedStatus);
    setSubscriptionEnabled(normalizedStatus.subscription?.enabled ?? false);
    setSendTime(normalizedStatus.subscription?.sendTime ?? DEFAULT_SEND_TIME);
  }, []);

  const loadStatus = useCallback(
    async (showError = true) => {
      setLoadingStatus(true);
      setStatusError(false);
      try {
        const res = await fetch("/api/telegram/status");
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const apiError = getApiError(data);
          if (showError) {
            messageApi.error(apiError?.error ?? "Не удалось загрузить статус");
          }
          setStatus(null);
          setStatusError(true);
          return;
        }
        applyStatus(data as StatusResponse);
      } catch (error) {
        setStatusError(true);
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
          setStatusError(true);
          return;
        }
        applyStatus(data as StatusResponse);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setStatusError(true);
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
  const telegramBotUrl = status?.botUrl ?? null;

  const botLinkButton = telegramBotUrl ? (
    <Button
      icon={<ExportOutlined aria-hidden />}
      href={telegramBotUrl}
      target="_blank"
      rel="noreferrer"
    >
      Перейти в Telegram-бота
    </Button>
  ) : null;
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
    return `Последняя ссылка действует до ${formatDate(status.codeExpiresAt)}.`;
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
          messageApi.error("Не удалось получить ссылку для привязки");
        }
        return;
      }
      const payload = data as LinkCodeResponse;
      setIssuedCode(payload.code);
      setIssuedLinkUrl(payload.linkUrl ?? null);
      setIssuedExpiresAt(payload.expiresAt);
      messageApi.success(payload.linkUrl ? "Ссылка для привязки получена" : "Код получен");
      await loadStatus(false);
    } catch (error) {
      messageApi.error("Не удалось получить ссылку для привязки");
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
      setIssuedLinkUrl(null);
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
  const PanelRoot = showHeader ? "section" : "div";

  return (
    <PanelRoot className={styles.panel}>
      {contextHolder}
      {showHeader ? (
        <>
          <Typography.Title level={4} className={styles.title}>
            Telegram
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.subtitle}>
            Получите ссылку, откройте Telegram и подтвердите привязку в боте.
          </Typography.Paragraph>
        </>
      ) : null}

      {loadingStatus ? (
        <Typography.Text aria-live="polite">Загрузка...</Typography.Text>
      ) : statusError ? (
        <Alert
          type="error"
          title={STATUS_ERROR_TITLE}
          description={STATUS_ERROR_DESCRIPTION}
          action={
            <Button
              onClick={() => {
                void loadStatus(false);
              }}
            >
              Повторить
            </Button>
          }
          showIcon
        />
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
                <label className={styles.settingRow} htmlFor="telegram-subscription-switch">
                  <Typography.Text>Подписка на рассылку</Typography.Text>
                  <span className={styles.switchTarget}>
                    <Switch
                      id="telegram-subscription-switch"
                      checked={subscriptionEnabled}
                      onChange={(checked) => {
                        setSubscriptionEnabled(checked);
                      }}
                      aria-label="Подписка на рассылку"
                    />
                  </span>
                </label>
                <label className={styles.timeField}>
                  <Typography.Text>Время рассылки</Typography.Text>
                  <Input
                    size="large"
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
                <div className={styles.actionButtons}>
                  {botLinkButton}
                  <Button danger onClick={handleUnlink} loading={unlinking}>
                    Отвязать Telegram
                  </Button>
                </div>
                <Typography.Text type="secondary">
                  При отвязке рассылка отключится. Можно будет связать другой аккаунт.
                </Typography.Text>
              </div>
            </>
          )}

          {!linked && (
            <div className={styles.actions}>
              <div className={styles.actionButtons}>
                <Button aria-label="Получить ссылку" onClick={handleIssueCode} loading={sending}>
                  Получить ссылку
                </Button>
                {botLinkButton}
              </div>
              <Typography.Text type="secondary">
                {activeCodeInfo || "Ссылка и код действуют 15 минут. Новая выдача заменит старую."}
              </Typography.Text>
            </div>
          )}

          {!linked && issuedCode && (
            <Card type="inner" className={styles.codeCard}>
              {issuedLinkUrl ? (
                <>
                  <Typography.Text>Откройте Telegram, чтобы завершить привязку:</Typography.Text>
                  <div className={styles.linkAction}>
                    <Button
                      type="primary"
                      icon={<ExportOutlined aria-hidden />}
                      href={issuedLinkUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть Telegram
                    </Button>
                  </div>
                  <Typography.Text type="secondary">
                    Если ссылка недоступна, отправьте боту код:
                  </Typography.Text>
                </>
              ) : (
                <Typography.Text>Ссылка на бота не настроена. Отправьте боту код:</Typography.Text>
              )}
              <Typography.Text className={styles.code}>{issuedCode}</Typography.Text>
              <Typography.Text type="secondary">
                Код действует до {formatDate(issuedExpiresAt)}.
              </Typography.Text>
            </Card>
          )}
        </>
      )}
    </PanelRoot>
  );
}
