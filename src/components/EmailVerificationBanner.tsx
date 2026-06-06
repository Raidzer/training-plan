"use client";

import { useState } from "react";
import { Alert, Button, message } from "antd";
import { useSession } from "next-auth/react";

import styles from "./EmailVerificationBanner.module.scss";

export function EmailVerificationBanner() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (res.ok) {
        messageApi.success("Письмо отправлено!");
      } else {
        const data = await res.json();
        if (data.error === "Email already verified") {
          messageApi.success("Email уже подтвержден.");
          await update();
        } else {
          messageApi.error("Ошибка при отправке письма.");
        }
      }
    } catch {
      messageApi.error("Произошла ошибка.");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user || session.user.emailVerified) {
    return null;
  }

  return (
    <div className={styles.container}>
      {contextHolder}
      <Alert
        title="Ваш Email не подтвержден"
        description={
          <div className={styles.description}>
            <span>Подтвердите почту для доступа ко всем функциям и восстановления доступа.</span>
            <Button size="small" type="primary" onClick={handleResend} loading={loading}>
              Отправить письмо повторно
            </Button>
          </div>
        }
        type="warning"
        showIcon
      />
    </div>
  );
}
