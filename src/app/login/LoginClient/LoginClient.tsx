"use client";

import { LockOutlined, MailOutlined, LoginOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormProps } from "antd";
import { LOGIN_TEXT } from "./constants/loginConstants";
import type { LoginFields } from "./types/loginTypes";
import styles from "./LoginClient.module.scss";

export function LoginClient() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish: FormProps<LoginFields>["onFinish"] = async (values) => {
    const res = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (res?.error) {
      messageApi.error(LOGIN_TEXT.invalidCredentials);
      return;
    }
    messageApi.success(LOGIN_TEXT.success);
    router.push(res?.url ?? "/dashboard");
  };

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          {LOGIN_TEXT.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {LOGIN_TEXT.subtitle}
        </Typography.Paragraph>
        <Form<LoginFields> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label={LOGIN_TEXT.emailLabel}
            rules={[{ required: true, message: LOGIN_TEXT.emailRequired }]}
          >
            <Input prefix={<MailOutlined />} placeholder={LOGIN_TEXT.emailPlaceholder} />
          </Form.Item>
          <Form.Item
            name="password"
            label={LOGIN_TEXT.passwordLabel}
            rules={[{ required: true, message: LOGIN_TEXT.passwordRequired }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={LOGIN_TEXT.passwordPlaceholder}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block>
            {LOGIN_TEXT.submit}
          </Button>
          <div className={styles.links}>
            <Link href="/auth/forgot-password">{LOGIN_TEXT.forgotPassword}</Link>
          </div>
        </Form>
      </Card>
    </main>
  );
}
