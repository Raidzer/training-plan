"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import styles from "./page.module.scss";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSuccess(true);
        messageApi.success("Если аккаунт существует, мы отправили письмо с инструкциями.");
      } else {
        messageApi.error("Произошла ошибка при отправке запроса.");
      }
    } catch {
      messageApi.error("Произошла ошибка. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        {contextHolder}
        <Card className={styles.cardCenter}>
          <Title level={3}>Проверьте почту</Title>
          <Text>Мы отправили письмо с ссылкой для сброса пароля. Пожалуйста проверьте почту</Text>
          <div className={styles.backToLogin}>
            <Link href="/login">
              <Button type="primary">Вернуться ко входу</Button>
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
          <Title level={3}>Сброс пароля</Title>
          <Text type="secondary">Введите email, чтобы получить ссылку для сброса</Text>
        </div>

        <Form name="forgot_password" onFinish={onFinish} layout="vertical" requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Пожалуйста, введите email!" },
              { type: "email", message: "Введите корректный email!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Отправить ссылку
            </Button>
          </Form.Item>

          <div className={styles.footer}>
            <Link href="/login" className={styles.linkCommon}>
              Вспомнили пароль? Войти
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
