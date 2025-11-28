"use client";
import { LockOutlined, MailOutlined, LoginOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { FormProps } from "antd";

type LoginFields = {
  email: string;
  password: string;
};

export default function LoginPage() {
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
    <main style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      {contextHolder}
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          Вход
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Используйте учетные данные, созданные при инициализации
          (you@example.com / password123).
        </Typography.Paragraph>
        <Form<LoginFields>
          layout="vertical"
          initialValues={{
            email: "you@example.com",
            password: "password123",
          }}
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Укажите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="password123"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<LoginOutlined />}
            block
          >
            Войти
          </Button>
        </Form>
      </Card>
    </main>
  );
}
