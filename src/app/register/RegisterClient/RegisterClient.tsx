"use client";

import { Button, Card, Form, Input, Typography, message, Radio, Select } from "antd";
import Link from "next/link";
import {
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { DEFAULT_TIMEZONE, filterTimezoneOption } from "@/shared/constants/timezones";
import { GENDER_OPTIONS, REGISTER_TEXT } from "./constants/registerConstants";
import type { RegisterFields } from "./types/registerTypes";
import { useRegisterForm } from "./hooks/useRegisterForm";
import styles from "./RegisterClient.module.scss";

export function RegisterClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, hasInvite, timezoneOptions, onFinish } = useRegisterForm(messageApi);

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          {REGISTER_TEXT.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {REGISTER_TEXT.subtitle}
        </Typography.Paragraph>
        {hasInvite ? (
          <Form<RegisterFields>
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ gender: "male", timezone: DEFAULT_TIMEZONE }}
          >
            <Form.Item
              name="name"
              label={REGISTER_TEXT.nameLabel}
              rules={[{ required: true, message: REGISTER_TEXT.nameRequired }]}
            >
              <Input prefix={<UserOutlined />} placeholder={REGISTER_TEXT.namePlaceholder} />
            </Form.Item>
            <Form.Item
              name="lastName"
              label={REGISTER_TEXT.lastNameLabel}
              rules={[{ max: 255, message: REGISTER_TEXT.lastNameMax }]}
            >
              <Input prefix={<UserOutlined />} placeholder={REGISTER_TEXT.lastNamePlaceholder} />
            </Form.Item>
            <Form.Item
              name="gender"
              label={REGISTER_TEXT.genderLabel}
              rules={[{ required: true, message: REGISTER_TEXT.genderRequired }]}
            >
              <Radio.Group options={GENDER_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="login"
              label={REGISTER_TEXT.loginLabel}
              rules={[
                { required: true, message: REGISTER_TEXT.loginRequired },
                { min: 3, message: REGISTER_TEXT.loginMin },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder={REGISTER_TEXT.loginPlaceholder} />
            </Form.Item>
            <Form.Item
              name="email"
              label={REGISTER_TEXT.emailLabel}
              rules={[
                { required: true, message: REGISTER_TEXT.emailRequired },
                { type: "email", message: REGISTER_TEXT.emailInvalid },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder={REGISTER_TEXT.emailPlaceholder} />
            </Form.Item>
            <Form.Item
              name="timezone"
              label={REGISTER_TEXT.timezoneLabel}
              rules={[{ required: true, message: REGISTER_TEXT.timezoneRequired }]}
            >
              <Select
                showSearch
                options={timezoneOptions}
                placeholder={REGISTER_TEXT.timezonePlaceholder}
                optionFilterProp="label"
                filterOption={filterTimezoneOption}
                suffixIcon={<GlobalOutlined />}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={REGISTER_TEXT.passwordLabel}
              rules={[
                { required: true, message: REGISTER_TEXT.passwordRequired },
                {
                  min: 6,
                  message: REGISTER_TEXT.passwordMin,
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={REGISTER_TEXT.passwordPlaceholder}
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={REGISTER_TEXT.confirmPasswordLabel}
              dependencies={["password"]}
              rules={[
                { required: true, message: REGISTER_TEXT.confirmPasswordRequired },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error(REGISTER_TEXT.confirmPasswordMismatch));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={REGISTER_TEXT.passwordPlaceholder}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UserAddOutlined />}
              block
              loading={loading}
            >
              {REGISTER_TEXT.submit}
            </Button>
            <Typography.Paragraph type="secondary" className={styles.subtitle}>
              {REGISTER_TEXT.existingAccount}{" "}
              <Link href="/login" passHref>
                {REGISTER_TEXT.login}
              </Link>
            </Typography.Paragraph>
          </Form>
        ) : (
          <div className={styles.notice}>
            <Typography.Paragraph type="secondary">
              {REGISTER_TEXT.inviteNotice}
            </Typography.Paragraph>
            <Link href="/login" passHref>
              <Button block>{REGISTER_TEXT.backToLogin}</Button>
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
