import { ArrowLeftOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import Link from "next/link";
import { RECORDS_LABELS } from "../../constants/recordsConstants";
import styles from "./RecordsHeader.module.scss";

export function RecordsHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <span className={styles.eyebrow}>{RECORDS_LABELS.eyebrow}</span>
        <Typography.Title level={1} className={styles.title}>
          {RECORDS_LABELS.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {RECORDS_LABELS.subtitle}
        </Typography.Paragraph>
      </div>

      <Link href="/profile" className={styles.backLink}>
        <ArrowLeftOutlined aria-hidden />
        <span>{RECORDS_LABELS.backButton}</span>
      </Link>
    </header>
  );
}
