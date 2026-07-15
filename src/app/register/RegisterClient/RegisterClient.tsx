"use client";

import { App } from "antd";
import { REGISTER_TEXT, REGISTER_TITLE_ID } from "./constants/registerConstants";
import { RegisterForm } from "./components/RegisterForm/RegisterForm";
import { RegisterInviteNotice } from "./components/RegisterInviteNotice/RegisterInviteNotice";
import { useRegisterForm } from "./hooks/useRegisterForm";
import styles from "./RegisterClient.module.scss";

export function RegisterClient() {
  const { message: messageApi } = App.useApp();
  const { loading, hasInvite, timezoneOptions, onFinish } = useRegisterForm(messageApi);

  return (
    <div className={styles.content} aria-labelledby={REGISTER_TITLE_ID}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{REGISTER_TEXT.eyebrow}</span>
        <h1 id={REGISTER_TITLE_ID} className={styles.title}>
          {REGISTER_TEXT.title}
        </h1>
        <p className={styles.subtitle}>{REGISTER_TEXT.subtitle}</p>
      </header>

      {hasInvite ? (
        <RegisterForm loading={loading} timezoneOptions={timezoneOptions} onFinish={onFinish} />
      ) : (
        <RegisterInviteNotice />
      )}
    </div>
  );
}
