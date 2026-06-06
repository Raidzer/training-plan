"use client";

import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { FORGOT_PASSWORD_TEXT } from "./constants/forgotPasswordConstants";
import type { ForgotPasswordFields } from "./types/forgotPasswordTypes";
import styles from "./ForgotPasswordClient.module.scss";

const { Title, Text } = Typography;

export function ForgotPasswordClient() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: ForgotPasswordFields) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSuccess(true);
        messageApi.success(FORGOT_PASSWORD_TEXT.successMessage);
      } else {
        messageApi.error(FORGOT_PASSWORD_TEXT.sendError);
      }
    } catch {
      messageApi.error(FORGOT_PASSWORD_TEXT.requestError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        {contextHolder}
        <Card className={styles.cardCenter}>
          <Title level={3}>{FORGOT_PASSWORD_TEXT.successTitle}</Title>
          <Text>{FORGOT_PASSWORD_TEXT.successDescription}</Text>
          <div className={styles.backToLogin}>
            <Link href="/login">
              <Button type="primary">{FORGOT_PASSWORD_TEXT.backToLogin}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {contextHolder}
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3}>{FORGOT_PASSWORD_TEXT.title}</Title>
          <Text type="secondary">{FORGOT_PASSWORD_TEXT.subtitle}</Text>
        </div>

        <Form<ForgotPasswordFields>
          name="forgot_password"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label={FORGOT_PASSWORD_TEXT.emailLabel}
            rules={[
              { required: true, message: FORGOT_PASSWORD_TEXT.emailRequired },
              { type: "email", message: FORGOT_PASSWORD_TEXT.emailInvalid },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={FORGOT_PASSWORD_TEXT.emailPlaceholder}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              {FORGOT_PASSWORD_TEXT.submit}
            </Button>
          </Form.Item>

          <div className={styles.footer}>
            <Link href="/login" className={styles.linkCommon}>
              {FORGOT_PASSWORD_TEXT.loginLink}
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
