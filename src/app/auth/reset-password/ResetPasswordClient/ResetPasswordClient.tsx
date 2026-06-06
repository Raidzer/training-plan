"use client";

import { Suspense, useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { RESET_PASSWORD_TEXT } from "./constants/resetPasswordConstants";
import type { ResetPasswordFields, ResetPasswordResponse } from "./types/resetPasswordTypes";
import styles from "./ResetPasswordClient.module.scss";

const { Title, Text } = Typography;

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [messageApi, contextHolder] = message.useMessage();

  if (!token) {
    return (
      <Card className={styles.cardCenter}>
        <Title level={4} type="danger">
          {RESET_PASSWORD_TEXT.invalidTokenTitle}
        </Title>
        <Text>{RESET_PASSWORD_TEXT.invalidTokenDescription}</Text>
      </Card>
    );
  }

  const onFinish = async (values: ResetPasswordFields) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      const data = (await response.json().catch(() => null)) as ResetPasswordResponse | null;

      if (response.ok) {
        messageApi.success(RESET_PASSWORD_TEXT.success);
        router.push("/login");
      } else {
        messageApi.error(data?.error || RESET_PASSWORD_TEXT.resetError);
      }
    } catch {
      messageApi.error(RESET_PASSWORD_TEXT.requestError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={styles.card}>
      {contextHolder}
      <div className={styles.titleWrapper}>
        <Title level={3}>{RESET_PASSWORD_TEXT.title}</Title>
        <Text type="secondary">{RESET_PASSWORD_TEXT.subtitle}</Text>
      </div>

      <Form<ResetPasswordFields>
        name="reset_password"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="password"
          label={RESET_PASSWORD_TEXT.passwordLabel}
          rules={[
            { required: true, message: RESET_PASSWORD_TEXT.passwordRequired },
            { min: 6, message: RESET_PASSWORD_TEXT.passwordMin },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={RESET_PASSWORD_TEXT.passwordPlaceholder}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirm"
          label={RESET_PASSWORD_TEXT.confirmLabel}
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: RESET_PASSWORD_TEXT.confirmRequired },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(RESET_PASSWORD_TEXT.confirmMismatch));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={RESET_PASSWORD_TEXT.confirmPlaceholder}
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            {RESET_PASSWORD_TEXT.submit}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export function ResetPasswordClient() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<Card loading className={styles.card} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
