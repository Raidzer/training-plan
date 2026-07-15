"use client";

import { LoginForm } from "./components/LoginForm/LoginForm";
import { LOGIN_FORM_IDS, LOGIN_TEXT } from "./constants/loginConstants";
import { useLoginForm } from "./hooks/useLoginForm";
import styles from "./LoginClient.module.scss";

export function LoginClient() {
  const { isSubmitting, onFinish } = useLoginForm();

  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{LOGIN_TEXT.eyebrow}</span>
        <h1 id={LOGIN_FORM_IDS.title} className={styles.title}>
          {LOGIN_TEXT.title}
        </h1>
        <p className={styles.subtitle}>{LOGIN_TEXT.subtitle}</p>
      </header>

      <LoginForm isSubmitting={isSubmitting} onFinish={onFinish} />
    </div>
  );
}
