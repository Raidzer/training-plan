"use client";

import { LockOutlined, MailOutlined, LoginOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormProps } from "antd";
import styles from "./login.module.scss";

type LoginFields = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish: FormProps<LoginFields>["onFinish"] = async (values) => {
    const res = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (res?.error) {
      messageApi.error("Неверный email или пароль");
      return;
    }
    messageApi.success("Вход выполнен");
    router.push(res?.url ?? "/dashboard");
  };

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          Вход
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          Используйте учетные данные, созданные при инициализации
        </Typography.Paragraph>
        <Form<LoginFields> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email или login"
            rules={[{ required: true, message: "Укажите email или логин" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Введите email или логин" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Введите пароль" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block>
            Войти
          </Button>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/auth/forgot-password">Забыли пароль?</Link>
          </div>
        </Form>
      </Card>
    </main>
  );
}
