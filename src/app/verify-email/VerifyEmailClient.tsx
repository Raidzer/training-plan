"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import styles from "./verify-email.module.scss";

type StatusResponse = {
  email: string;
  emailVerifiedAt: string | null;
  nextResendAt: string | null;
  codeExpiresAt: string | null;
};

type ConfirmValues = {
  code: string;
};

const getApiError = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const error = "error" in value ? (value as { error?: unknown }).error : null;
  const retryAt =
    "retryAt" in value ? (value as { retryAt?: unknown }).retryAt : null;
  return {
    error: typeof error === "string" ? error : undefined,
    retryAt: typeof retryAt === "string" ? retryAt : undefined,
  };
};

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | null) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleString() : "н/д";
};

const getResendInfo = (value: string | null) => {
  const parsed = parseDate(value);
  if (!parsed) return { canResend: true, message: "" };
  const diffMs = parsed.getTime() - Date.now();
  if (diffMs <= 0) return { canResend: true, message: "" };
  const minutes = Math.ceil(diffMs / 60000);
  return {
    canResend: false,
    message: `Повторная отправка через ${minutes} мин`,
  };
};

export function VerifyEmailClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<ConfirmValues>();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const loadStatus = async (showError = true) => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/email-verification/status");
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

  const verified = Boolean(status?.emailVerifiedAt);
  const resendInfo = useMemo(
    () => getResendInfo(status?.nextResendAt ?? null),
    [status?.nextResendAt]
  );

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/email-verification/send", {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = getApiError(data);
        if (apiError?.error === "retry-later" && apiError.retryAt) {
          messageApi.warning(
            `Повторная отправка доступна в ${formatDate(apiError.retryAt)}`
          );
        } else if (apiError?.error === "already-verified") {
          messageApi.info("Почта уже подтверждена");
        } else {
          messageApi.error("Не удалось отправить код");
        }
        return;
      }
      messageApi.success("Код подтверждения отправлен");
      await loadStatus(false);
    } catch (error) {
      messageApi.error("Не удалось отправить код");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async (values: ConfirmValues) => {
    setConfirming(true);
    try {
      const res = await fetch("/api/email-verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = getApiError(data);
        switch (apiError?.error) {
          case "code-expired":
            messageApi.error("Код истек");
            break;
          case "code-used":
            messageApi.error("Код уже использован");
            break;
          case "code-invalid":
            messageApi.error("Неверный код");
            break;
          case "code-missing":
            messageApi.error("Код не найден");
            break;
          case "already-verified":
            messageApi.info("Почта уже подтверждена");
            break;
          default:
            messageApi.error("Не удалось подтвердить код");
        }
        return;
      }
      messageApi.success("Почта подтверждена");
      form.resetFields();
      await loadStatus(false);
    } catch (error) {
      messageApi.error("Не удалось подтвердить код");
      console.error(error);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          Подтверждение почты
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          Проверьте статус и подтвердите вашу почту.
        </Typography.Paragraph>

        {loadingStatus ? (
          <Typography.Text>Загрузка...</Typography.Text>
        ) : (
          <>
            <Alert
              type={verified ? "success" : "warning"}
              title={verified ? "Почта подтверждена" : "Почта не подтверждена"}
              description={
                status?.email
                  ? `Почта: ${status.email}`
                  : "Статус почты недоступен"
              }
              showIcon
            />

            {!verified && (
              <div className={styles.actions}>
                <Button
                  onClick={handleSend}
                  loading={sending}
                  disabled={!resendInfo.canResend}
                >
                  Отправить код
                </Button>
                <Typography.Text type="secondary">
                  {resendInfo.message ||
                    `Код истекает ${formatDate(status?.codeExpiresAt ?? null)}`}
                </Typography.Text>
              </div>
            )}

            {!verified && (
              <Form<ConfirmValues>
                form={form}
                layout="vertical"
                onFinish={handleConfirm}
                requiredMark={false}
              >
                <Form.Item
                  name="code"
                  label="Код подтверждения"
                  rules={[
                    { required: true, message: "Введите код" },
                    { pattern: /^\d{6}$/, message: "Используйте 6 цифр" },
                  ]}
                >
                  <Input placeholder="123456" maxLength={6} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={confirming}>
                  Подтвердить почту
                </Button>
              </Form>
            )}
          </>
        )}
      </Card>
    </main>
  );
}
