"use client";

import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
  type FormProps,
  Radio,
  Select,
} from "antd";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  UserAddOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import styles from "./register.module.scss";

type RegisterFields = {
  name: string;
  lastName?: string;
  gender: "male" | "female";
  login: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone: string;
};

const GENDER_OPTIONS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
];

function RegisterContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const searchParams = useSearchParams();
  const inviteToken = (searchParams.get("invite") ?? "").trim();
  const hasInvite = inviteToken.length >= 10;

  const timezoneOptions = useMemo(() => {
    try {
      const timeZones = Intl.supportedValuesOf("timeZone");
      return timeZones.map((tz) => {
        try {
          const date = new Date();
          const gmt =
            new Intl.DateTimeFormat("en-US", {
              timeZone: tz,
              timeZoneName: "longOffset",
            })
              .formatToParts(date)
              .find((p) => p.type === "timeZoneName")?.value ?? "";

          return { value: tz, label: `${tz} (${gmt})` };
        } catch {
          return { value: tz, label: tz };
        }
      });
    } catch {
      return [
        { value: "Europe/Moscow", label: "Europe/Moscow (GMT+3)" },
        { value: "UTC", label: "UTC (GMT+0)" },
      ];
    }
  }, []);

  const onFinish: FormProps<RegisterFields>["onFinish"] = async (values) => {
    if (!hasInvite) {
      messageApi.error("Регистрация доступна только по приглашению.");
      return;
    }
    const { confirmPassword, ...payload } = values;
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, inviteToken }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        const apiError = data?.error;
        if (apiError === "invite_invalid") {
          messageApi.error("Приглашение не найдено.");
          return;
        }
        if (apiError === "invite_used") {
          messageApi.error("Приглашение уже использовано.");
          return;
        }
        if (apiError === "invite_expired") {
          messageApi.error("Срок действия приглашения истек.");
          return;
        }
        messageApi.error(data?.error ?? "Не удалось завершить регистрацию, попробуйте ещё раз.");
        return;
      }

      messageApi.success("Аккаунт создан, входим...");

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: "/dashboard",
      });

      if (loginRes?.error) {
        messageApi.warning("Регистрация успешна, но не удалось войти. Попробуйте войти вручную.");
        router.push("/login");
        return;
      }

      router.push(loginRes?.url ?? "/dashboard");
    } catch (err) {
      messageApi.error("Произошла ошибка. Попробуйте ещё раз.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          Регистрация
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          Создайте новый аккаунт, чтобы получить доступ к панели и планам.
        </Typography.Paragraph>
        {hasInvite ? (
          <Form<RegisterFields>
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ gender: "male", timezone: "Europe/Moscow" }}
          >
            <Form.Item name="name" label="Имя" rules={[{ required: true, message: "Введите имя" }]}>
              <Input prefix={<UserOutlined />} placeholder="Иван" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Фамилия"
              rules={[{ max: 255, message: "Фамилия слишком длинная" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Иванов" />
            </Form.Item>
            <Form.Item
              name="gender"
              label="Пол"
              rules={[{ required: true, message: "Выберите пол" }]}
            >
              <Radio.Group options={GENDER_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="login"
              label="Логин"
              rules={[
                { required: true, message: "Введите логин" },
                { min: 3, message: "Логин должен содержать не менее 3 символов" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Ваш логин" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Почта"
              rules={[
                { required: true, message: "Введите email" },
                { type: "email", message: "Некорректный email" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Ваш email" />
            </Form.Item>
            <Form.Item
              name="timezone"
              label="Часовой пояс"
              rules={[{ required: true, message: "Выберите часовой пояс" }]}
            >
              <Select
                showSearch
                options={timezoneOptions}
                placeholder="Выберите часовой пояс"
                optionFilterProp="label"
                suffixIcon={<GlobalOutlined />}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Пароль"
              rules={[
                { required: true, message: "Введите пароль" },
                {
                  min: 6,
                  message: "Минимум 6 символов",
                },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="********" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Подтвердите пароль"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Подтвердите пароль" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Пароли не совпадают"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="********" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UserAddOutlined />}
              block
              loading={loading}
            >
              Зарегистрироваться
            </Button>
            <Typography.Paragraph type="secondary" className={styles.subtitle}>
              Уже есть аккаунт?{" "}
              <Link href="/login" passHref>
                Войти
              </Link>
            </Typography.Paragraph>
          </Form>
        ) : (
          <div className={styles.notice}>
            <Typography.Paragraph type="secondary">
              Регистрация доступна только по пригласительной ссылке.
            </Typography.Paragraph>
            <Link href="/login" passHref>
              <Button block>Вернуться ко входу</Button>
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
