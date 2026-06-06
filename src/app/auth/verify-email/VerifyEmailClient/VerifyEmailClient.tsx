"use client";

import { Suspense, useEffect } from "react";
import { Card, Typography, Button, Spin } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VERIFY_EMAIL_TEXT } from "./constants/verifyEmailConstants";
import styles from "./VerifyEmailClient.module.scss";

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
        <Title level={3}>{VERIFY_EMAIL_TEXT.errorTitle}</Title>
        <Text type="secondary" className={styles.textBlock}>
          {error === "expired" ? VERIFY_EMAIL_TEXT.expiredError : VERIFY_EMAIL_TEXT.invalidError}
        </Text>
        <Link href="/login">
          <Button type="primary">{VERIFY_EMAIL_TEXT.backToLogin}</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <Spin size="large" />
      <div className={styles.spinContainer}>{VERIFY_EMAIL_TEXT.loading}</div>
    </Card>
  );
}

export function VerifyEmailClient() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<Spin size="large" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
