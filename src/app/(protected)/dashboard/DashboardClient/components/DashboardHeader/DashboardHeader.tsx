"use client";

import { Typography } from "antd";
import Link from "next/link";
import { ProfileButton } from "@/components/ProfileButton/ProfileButton";
import { SignOutButton } from "@/components/SingOutButton/SignOutButton";
import { DASHBOARD_LABELS } from "../../constants/dashboardConstants";
import styles from "./DashboardHeader.module.scss";

type DashboardHeaderProps = {
  userName?: string | null | undefined;
  userEmail?: string | null | undefined;
};

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  const greetingTarget = userName ?? userEmail ?? DASHBOARD_LABELS.defaultGreetingTarget;

  return (
    <div className={styles.cardHeader}>
      <div className={styles.headerText}>
        <Typography.Title level={3} className={styles.paragraphTight}>
          {DASHBOARD_LABELS.greetingPrefix}, {greetingTarget}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.paragraphTight}>
          {DASHBOARD_LABELS.subtitle}
        </Typography.Paragraph>
      </div>
      <div className={styles.headerAction}>
        <Link href="/profile">
          <ProfileButton />
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
