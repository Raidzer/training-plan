import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";
import { TEMPLATE_ROUTES, TEMPLATES_LABELS } from "../../constants/templatesConstants";
import styles from "./TemplatesHeader.module.scss";

export function TemplatesHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <span className={styles.eyebrow}>{TEMPLATES_LABELS.eyebrow}</span>
        <h1 className={styles.title}>{TEMPLATES_LABELS.title}</h1>
        <p className={styles.subtitle}>{TEMPLATES_LABELS.subtitle}</p>
      </div>

      <div className={styles.actions}>
        <Link href={TEMPLATE_ROUTES.dashboard} className={styles.backLink}>
          <ArrowLeftOutlined aria-hidden />
          <span>{TEMPLATES_LABELS.dashboardAction}</span>
        </Link>
        <Link href={TEMPLATE_ROUTES.create} className={styles.createLink}>
          <PlusOutlined aria-hidden />
          <span>{TEMPLATES_LABELS.createAction}</span>
        </Link>
      </div>
    </header>
  );
}
