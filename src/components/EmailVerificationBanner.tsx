"use client";

import React, { useState, useEffect } from "react";
import { Alert, Button, message } from "antd";
import { useSession } from "next-auth/react";

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const isHidden = localStorage.getItem("hide_verification_banner");

    if (session?.user && !session.user.emailVerified && !isHidden) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [session]);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem("hide_verification_banner", "true");
  };

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
          messageApi.success("Email уже подтвержден! Обновите страницу.");
          setVisible(false);
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

  if (!visible) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {contextHolder}
      <Alert
        title="Ваш Email не подтвержден"
        description={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>Подтвердите почту для доступа ко всем функциям и восстановления доступа.</span>
            <Button size="small" type="primary" onClick={handleResend} loading={loading}>
              Отправить письмо повторно
            </Button>
          </div>
        }
        type="warning"
        closable
        onClose={handleClose}
        showIcon
      />
    </div>
  );
}
