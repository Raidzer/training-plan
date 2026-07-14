import { ArrowLeftOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import Link from "next/link";
import { shoesLabels } from "../../constants/shoesConstants";
import styles from "./ShoesHeader.module.scss";

export function ShoesHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <span className={styles.eyebrow}>{shoesLabels.eyebrow}</span>
        <Typography.Title level={1} className={styles.title}>
          {shoesLabels.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {shoesLabels.subtitle}
        </Typography.Paragraph>
      </div>

      <Link href="/dashboard" className={styles.backLink}>
        <ArrowLeftOutlined aria-hidden />
        <span>{shoesLabels.backButton}</span>
      </Link>
    </header>
  );
}
