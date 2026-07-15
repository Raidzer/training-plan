"use client";

import { EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { SignOutButton } from "@/components/SingOutButton/SignOutButton";
import { DASHBOARD_LABELS } from "../../constants/dashboardConstants";
import styles from "./DashboardHeader.module.scss";

type DashboardHeaderProps = {
  userName?: string | null | undefined;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const normalizedUserName = userName?.trim();
  const greeting = normalizedUserName
    ? `${DASHBOARD_LABELS.greetingPrefix}, ${normalizedUserName}. ${DASHBOARD_LABELS.subtitle}`
    : DASHBOARD_LABELS.subtitle;

  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h1 className={styles.title}>{DASHBOARD_LABELS.title}</h1>
        <p className={styles.greeting}>{greeting}</p>
      </div>
      <div className={styles.headerActions}>
        <Link href="/profile" className={styles.profileLink}>
          <EditOutlined aria-hidden />
          <span>{DASHBOARD_LABELS.profileAction}</span>
        </Link>
        <SignOutButton className={styles.actionControl} />
      </div>
    </header>
  );
}
