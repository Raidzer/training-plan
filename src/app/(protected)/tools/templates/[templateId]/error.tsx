"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import styles from "./TemplateEditorRoute.module.scss";

type TemplateEditorErrorProps = {
  reset: () => void;
};

export default function TemplateEditorError({ reset }: TemplateEditorErrorProps) {
  return (
    <section className={styles.error} role="alert" aria-labelledby="template-editor-error-title">
      <span className={styles.errorCode} aria-hidden>
        ERR
      </span>
      <h1 id="template-editor-error-title">Редактор временно недоступен</h1>
      <p>Не удалось загрузить шаблон. Повторите запрос или вернитесь к списку шаблонов.</p>
      <div className={styles.errorActions}>
        <Button size="large" icon={<ReloadOutlined aria-hidden />} onClick={reset}>
          Повторить
        </Button>
        <Link href="/tools/templates" className={styles.errorLink}>
          К шаблонам
        </Link>
      </div>
    </section>
  );
}
