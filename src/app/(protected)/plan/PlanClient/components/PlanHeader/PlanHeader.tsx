"use client";

import { HomeOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import styles from "./PlanHeader.module.scss";

export type PlanHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  dashboardHref: string;
  dashboardLabel: string;
  addDayLabel: string;
  onAddDay: () => void;
};

export function PlanHeader({
  eyebrow,
  title,
  subtitle,
  dashboardHref,
  dashboardLabel,
  addDayLabel,
  onAddDay,
}: PlanHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.actions} role="group" aria-label="Действия страницы">
        <Link href={dashboardHref} className={styles.dashboardLink}>
          <HomeOutlined aria-hidden />
          <span>{dashboardLabel}</span>
        </Link>
        <Button
          type="primary"
          size="large"
          className={styles.addButton}
          icon={<PlusOutlined aria-hidden />}
          onClick={onAddDay}
        >
          {addDayLabel}
        </Button>
      </div>
    </header>
  );
}
