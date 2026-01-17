"use client";

import React, { Suspense, useEffect } from "react";
import { Card, Typography, Button, Spin } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.scss";

const { Title, Text } = Typography;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (token && !error) {
      window.location.href = `/api/auth/verify-email?token=${token}`;
    }
  }, [token, error]);

  if (error) {
    return (
      <Card className={styles.card}>
        <CloseCircleOutlined className={styles.icon} />
        <Title level={3}>Ошибка подтверждения</Title>
        <Text type="secondary" className={styles.textBlock}>
          {error === "expired" ? "Ссылка истекла." : "Неверная или устаревшая ссылка."}
        </Text>
        <Link href="/login">
          <Button type="primary">Вернуться ко входу</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <Spin size="large" />
      <div className={styles.spinContainer}>Проверка ссылки...</div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<Spin size="large" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
