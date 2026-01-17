"use client";

import React, { useState, Suspense } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.scss";

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
          Ошибка
        </Title>
        <Text>Неверная ссылка для сброса пароля. Отсутствует токен.</Text>
      </Card>
    );
  }

  const onFinish = async (values: { password: string }) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success("Пароль успешно изменен!");
        router.push("/login");
      } else {
        messageApi.error(data.error || "Произошла ошибка при сбросе пароля.");
      }
    } catch {
      messageApi.error("Произошла ошибка. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={styles.card}>
      {contextHolder}
      <div className={styles.titleWrapper}>
        <Title level={3}>Новый пароль</Title>
        <Text type="secondary">Придумайте новый надежный пароль</Text>
      </div>

      <Form name="reset_password" onFinish={onFinish} layout="vertical" requiredMark={false}>
        <Form.Item
          name="password"
          label="Новый пароль"
          rules={[
            { required: true, message: "Пожалуйста, введите пароль!" },
            { min: 6, message: "Пароль должен быть не менее 6 символов!" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Новый пароль" size="large" />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="Подтвердите пароль"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Пожалуйста, подтвердите пароль!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Пароли не совпадают!"));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Подтвердите пароль" size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Сменить пароль
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<Card loading className={styles.card} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
