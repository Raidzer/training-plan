"use client";

import { Button, Space, Typography } from "antd";
import Link from "next/link";
import { CalendarOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import styles from "../diary.module.scss";

type DiaryHeaderProps = {
  title: string;
  subtitle: string;
  periodHref: string;
  periodLabel: string;
  dashboardHref: string;
  dashboardLabel: string;
};

export function DiaryHeader({
  title,
  subtitle,
  periodHref,
  periodLabel,
  dashboardHref,
  dashboardLabel,
}: DiaryHeaderProps) {
  return (
    <div className={styles.headerRow}>
      <div className={styles.headerText}>
        <Typography.Title level={3} className={styles.typographyTitle}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.typographyParagraph}>
          {subtitle}
        </Typography.Paragraph>
      </div>
      <Space size="small" className={styles.headerActions}>
        <Link href={periodHref} passHref>
          <Button icon={<CalendarOutlined />}>{periodLabel}</Button>
        </Link>
        <Link href={dashboardHref} passHref>
          <Button icon={<ArrowLeftOutlined />}>{dashboardLabel}</Button>
        </Link>
      </Space>
    </div>
  );
}
