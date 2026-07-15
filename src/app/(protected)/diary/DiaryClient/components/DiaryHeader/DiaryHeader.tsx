"use client";

import { Button } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";
import styles from "./DiaryHeader.module.scss";

type DiaryHeaderProps = {
  title: string;
  subtitle: string;
  periodHref: string;
  periodLabel: string;
  onBack: () => void;
  dashboardLabel: string;
};

export function DiaryHeader({
  title,
  subtitle,
  periodHref,
  periodLabel,
  onBack,
  dashboardLabel,
}: DiaryHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.actions} role="group" aria-label="Действия страницы">
        <Link href={periodHref} className={styles.periodLink}>
          <CalendarOutlined aria-hidden />
          <span>{periodLabel}</span>
        </Link>
        <Button
          className={styles.backButton}
          icon={<ArrowLeftOutlined aria-hidden />}
          onClick={onBack}
        >
          {dashboardLabel}
        </Button>
      </div>
    </header>
  );
}
