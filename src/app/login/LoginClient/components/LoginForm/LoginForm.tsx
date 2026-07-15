import { LockOutlined, LoginOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import Link from "next/link";
import { LOGIN_FORM_IDS, LOGIN_TEXT } from "../../constants/loginConstants";
import type { LoginFields } from "../../types/loginTypes";
import styles from "./LoginForm.module.scss";

type LoginFormProps = {
  isSubmitting: boolean;
  onFinish: (values: LoginFields) => Promise<void> | void;
};

const INPUT_CLASS_NAMES = {
  root: styles.control,
  prefix: styles.controlPrefix,
  input: styles.controlInput,
} as const;

export function LoginForm({ isSubmitting, onFinish }: LoginFormProps) {
  return (
    <Form<LoginFields>
      id={LOGIN_FORM_IDS.form}
      name={LOGIN_FORM_IDS.form}
      className={styles.form}
      classNames={{
        label: styles.label,
        help: styles.help,
      }}
      layout="vertical"
      autoComplete="on"
      disabled={isSubmitting}
      requiredMark={false}
      scrollToFirstError={{ focus: true }}
      validateTrigger="onBlur"
      aria-busy={isSubmitting}
      aria-labelledby={LOGIN_FORM_IDS.title}
      onFinish={onFinish}
    >
      <Form.Item<LoginFields>
        className={styles.formItem}
        name="email"
        htmlFor={LOGIN_FORM_IDS.identifier}
        label={LOGIN_TEXT.emailLabel}
        rules={[
          { required: true, message: LOGIN_TEXT.emailRequired },
          { min: 2, message: LOGIN_TEXT.emailMin },
          { max: 255, message: LOGIN_TEXT.emailMax },
        ]}
      >
        <Input
          id={LOGIN_FORM_IDS.identifier}
          name="email"
          classNames={INPUT_CLASS_NAMES}
          autoComplete="username"
          autoCapitalize="none"
          enterKeyHint="next"
          placeholder={LOGIN_TEXT.emailPlaceholder}
          prefix={<UserOutlined aria-hidden="true" />}
          size="large"
          spellCheck={false}
          type="text"
          aria-required="true"
        />
      </Form.Item>

      <Form.Item<LoginFields>
        className={styles.formItem}
        name="password"
        htmlFor={LOGIN_FORM_IDS.password}
        label={LOGIN_TEXT.passwordLabel}
        rules={[
          { required: true, message: LOGIN_TEXT.passwordRequired },
          { min: 6, message: LOGIN_TEXT.passwordMin },
        ]}
      >
        <Input.Password
          id={LOGIN_FORM_IDS.password}
          name="password"
          classNames={INPUT_CLASS_NAMES}
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder={LOGIN_TEXT.passwordPlaceholder}
          prefix={<LockOutlined aria-hidden="true" />}
          size="large"
          aria-required="true"
        />
      </Form.Item>

      <Button
        className={styles.submit}
        type="primary"
        htmlType="submit"
        icon={<LoginOutlined aria-hidden="true" />}
        block
        loading={isSubmitting}
        size="large"
      >
        {LOGIN_TEXT.submit}
      </Button>

      <div className={styles.links}>
        <Link className={styles.supportLink} href="/auth/forgot-password">
          {LOGIN_TEXT.forgotPassword}
        </Link>
      </div>
    </Form>
  );
}
