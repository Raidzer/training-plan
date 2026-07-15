import { ArrowLeftOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import Link from "next/link";
import { competitionsLabels } from "../../constants/competitionsConstants";
import styles from "./CompetitionsHeader.module.scss";

export function CompetitionsHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <span className={styles.eyebrow}>{competitionsLabels.eyebrow}</span>
        <Typography.Title level={1} className={styles.title}>
          {competitionsLabels.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {competitionsLabels.subtitle}
        </Typography.Paragraph>
      </div>

      <Link href="/dashboard" className={styles.backLink}>
        <ArrowLeftOutlined aria-hidden />
        <span>{competitionsLabels.backButton}</span>
      </Link>
    </header>
  );
}
