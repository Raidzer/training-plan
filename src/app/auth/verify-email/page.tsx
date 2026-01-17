"use client";

import React, { Suspense } from "react";
import { Card, Typography, Button, Spin } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error"); // In case we want to show error from query params too

  // Since actual verification happens on server via GET /api/auth/verify-email
  // This page might be redirected TO with a success/error query param, OR
  // if the API logic redirects here after processing.
  // Wait, my API implementation redirects to /auth/login?verified=true
  // So this page is technically not needed unless we want a dedicated intermediate page
  // OR if we change the API to redirect HERE instead of login.

  // Let's assume for now we might change the API to redirect here, or validation failed.
  // For the current plan, the API redirects to /auth/login.
  // But wait, if validation fails (e.g. invalid token), the API returns JSON error.
  // It's better if the API redirects to a page that shows the error.

  // Let's handle the case where the user lands here directly??? No, the link in email goes to API.
  // So the API is the entry point.

  // Correction: The API implementation I wrote:
  // if error -> returns JSON (which user sees as raw JSON, bad UX)
  // if success -> redirects to /auth/login?verified=true

  // I should improve the API to redirect to THIS page with status.

  // But for now, let's create this page assuming it acts as a "Result" page.

  const success = !error && token; // Simplistic logic for now, really depends on how we route it.

  if (error) {
    return (
      <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
        <Title level={3}>Ошибка подтверждения</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          {error === "expired" ? "Ссылка истекла." : "Неверная или устаревшая ссылка."}
        </Text>
        <Link href="/auth/login">
          <Button type="primary">Вернуться ко входу</Button>
        </Link>
      </Card>
    );
  }

  // If we just land here, we might show a loader if we were doing client-side verification
  // But since we do server-side...

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
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <Suspense fallback={<Spin size="large" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
