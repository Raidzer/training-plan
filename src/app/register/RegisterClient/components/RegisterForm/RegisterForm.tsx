"use client";

import {
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Radio, Select } from "antd";
import Link from "next/link";
import { DEFAULT_TIMEZONE, filterTimezoneOption } from "@/shared/constants/timezones";
import type { TimezoneSelectOption } from "@/shared/constants/timezones";
import {
  GENDER_OPTIONS,
  REGISTER_FIELD_IDS,
  REGISTER_TEXT,
} from "../../constants/registerConstants";
import type { RegisterFields, RegisterSubmitHandler } from "../../types/registerTypes";
import { trimRegisterField } from "../../utils/registerUtils";
import styles from "./RegisterForm.module.scss";

type RegisterFormProps = {
  loading: boolean;
  timezoneOptions: TimezoneSelectOption[];
  onFinish: RegisterSubmitHandler;
};

function transformTrimmedValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return trimRegisterField(value);
}

export function RegisterForm({ loading, timezoneOptions, onFinish }: RegisterFormProps) {
  return (
    <Form<RegisterFields>
      name="register"
      className={styles.form}
      classNames={{
        label: styles.formLabel,
        help: styles.formHelp,
        extra: styles.formExtra,
      }}
      layout="vertical"
      autoComplete="on"
      disabled={loading}
      onFinish={onFinish}
      requiredMark={false}
      scrollToFirstError={{ focus: true, block: "center" }}
      validateTrigger="onBlur"
      initialValues={{ gender: "male", timezone: DEFAULT_TIMEZONE }}
      aria-busy={loading}
      aria-label={REGISTER_TEXT.formLabel}
    >
      <p className={styles.requiredHint}>{REGISTER_TEXT.requiredHint}</p>

      <div className={styles.grid}>
        <Form.Item
          className={styles.field}
          name="name"
          label={REGISTER_TEXT.nameLabel}
          htmlFor={REGISTER_FIELD_IDS.name}
          validateFirst
          rules={[
            {
              required: true,
              whitespace: true,
              message: REGISTER_TEXT.nameRequired,
            },
            {
              transform: transformTrimmedValue,
              min: 2,
              message: REGISTER_TEXT.nameMin,
            },
            {
              transform: transformTrimmedValue,
              max: 255,
              message: REGISTER_TEXT.nameMax,
            },
          ]}
        >
          <Input
            id={REGISTER_FIELD_IDS.name}
            name="name"
            type="text"
            autoComplete="given-name"
            placeholder={REGISTER_TEXT.namePlaceholder}
            prefix={<UserOutlined aria-hidden="true" />}
            classNames={{ root: styles.control, input: styles.controlInput }}
            size="large"
            aria-required="true"
          />
        </Form.Item>

        <Form.Item
          className={styles.field}
          name="lastName"
          label={REGISTER_TEXT.lastNameLabel}
          htmlFor={REGISTER_FIELD_IDS.lastName}
          validateFirst
          rules={[
            {
              transform: transformTrimmedValue,
              max: 255,
              message: REGISTER_TEXT.lastNameMax,
            },
          ]}
        >
          <Input
            id={REGISTER_FIELD_IDS.lastName}
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder={REGISTER_TEXT.lastNamePlaceholder}
            prefix={<UserOutlined aria-hidden="true" />}
            classNames={{ root: styles.control, input: styles.controlInput }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          className={styles.field}
          name="login"
          label={REGISTER_TEXT.loginLabel}
          htmlFor={REGISTER_FIELD_IDS.login}
          validateFirst
          rules={[
            {
              required: true,
              whitespace: true,
              message: REGISTER_TEXT.loginRequired,
            },
            {
              transform: transformTrimmedValue,
              min: 3,
              message: REGISTER_TEXT.loginMin,
            },
            {
              transform: transformTrimmedValue,
              max: 64,
              message: REGISTER_TEXT.loginMax,
            },
          ]}
        >
          <Input
            id={REGISTER_FIELD_IDS.login}
            name="login"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            enterKeyHint="next"
            placeholder={REGISTER_TEXT.loginPlaceholder}
            prefix={<UserOutlined aria-hidden="true" />}
            classNames={{ root: styles.control, input: styles.controlInput }}
            size="large"
            spellCheck={false}
            aria-required="true"
          />
        </Form.Item>

        <Form.Item
          className={styles.field}
          name="email"
          label={REGISTER_TEXT.emailLabel}
          htmlFor={REGISTER_FIELD_IDS.email}
          validateFirst
          rules={[
            {
              required: true,
              whitespace: true,
              message: REGISTER_TEXT.emailRequired,
            },
            {
              transform: transformTrimmedValue,
              type: "email",
              message: REGISTER_TEXT.emailInvalid,
            },
            {
              transform: transformTrimmedValue,
              max: 255,
              message: REGISTER_TEXT.emailMax,
            },
          ]}
        >
          <Input
            id={REGISTER_FIELD_IDS.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            enterKeyHint="next"
            placeholder={REGISTER_TEXT.emailPlaceholder}
            prefix={<MailOutlined aria-hidden="true" />}
            classNames={{ root: styles.control, input: styles.controlInput }}
            size="large"
            spellCheck={false}
            aria-required="true"
          />
        </Form.Item>

        <Form.Item
          className={styles.field}
          name="gender"
          label={<span id={REGISTER_FIELD_IDS.genderLabel}>{REGISTER_TEXT.genderLabel}</span>}
          htmlFor={REGISTER_FIELD_IDS.gender}
          rules={[{ required: true, message: REGISTER_TEXT.genderRequired }]}
        >
          <Radio.Group
            id={REGISTER_FIELD_IDS.gender}
            name="gender"
            className={styles.radioGroup}
            options={GENDER_OPTIONS}
            optionType="button"
            buttonStyle="solid"
            block
            aria-labelledby={REGISTER_FIELD_IDS.genderLabel}
            aria-required="true"
          />
        </Form.Item>

        <Form.Item
          className={styles.field}
          name="timezone"
          label={REGISTER_TEXT.timezoneLabel}
          htmlFor={REGISTER_FIELD_IDS.timezone}
          rules={[{ required: true, message: REGISTER_TEXT.timezoneRequired }]}
        >
          <Select
            id={REGISTER_FIELD_IDS.timezone}
            showSearch
            options={timezoneOptions}
            placeholder={REGISTER_TEXT.timezonePlaceholder}
            optionFilterProp="label"
            filterOption={filterTimezoneOption}
            suffixIcon={<GlobalOutlined aria-hidden="true" />}
            classNames={{
              root: styles.control,
              input: styles.controlInput,
              content: styles.selectContent,
            }}
            size="large"
            aria-required="true"
          />
        </Form.Item>

        <Form.Item
          className={`${styles.field} ${styles.fullWidth}`}
          name="password"
          label={REGISTER_TEXT.passwordLabel}
          htmlFor={REGISTER_FIELD_IDS.password}
          extra={REGISTER_TEXT.passwordHint}
          validateFirst
          rules={[
            { required: true, message: REGISTER_TEXT.passwordRequired },
            { min: 6, message: REGISTER_TEXT.passwordMin },
          ]}
        >
          <Input.Password
            id={REGISTER_FIELD_IDS.password}
            name="password"
            autoComplete="new-password"
            enterKeyHint="done"
            placeholder={REGISTER_TEXT.passwordPlaceholder}
            prefix={<LockOutlined aria-hidden="true" />}
            classNames={{ root: styles.control, input: styles.controlInput }}
            size="large"
            aria-required="true"
          />
        </Form.Item>
      </div>

      <Button
        className={styles.submitButton}
        type="primary"
        htmlType="submit"
        icon={<UserAddOutlined aria-hidden="true" />}
        block
        loading={loading}
        disabled={loading}
      >
        {REGISTER_TEXT.submit}
      </Button>

      <p className={styles.loginPrompt}>
        <span>{REGISTER_TEXT.existingAccount}</span>
        <Link href="/login">{REGISTER_TEXT.login}</Link>
      </p>
    </Form>
  );
}
