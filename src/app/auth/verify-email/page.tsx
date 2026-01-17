"use client";

import React, { Suspense, useEffect } from "react";
import { Card, Typography, Button, Spin } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
      <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
        <Title level={3}>Ошибка подтверждения</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          {error === "expired" ? "Ссылка истекла." : "Неверная или устаревшая ссылка."}
        </Text>
        <Link href="/login">
          <Button type="primary">Вернуться ко входу</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
      <Spin size="large" />
      <div style={{ marginTop: 20 }}>Проверка ссылки...</div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
        padding: "20px 0",
      }}
    >
      <Suspense fallback={<Spin size="large" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
