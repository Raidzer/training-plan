"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import Link from "next/link";
import type { MouseEvent } from "react";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import styles from "./ProfileHeader.module.scss";

type ProfileHeaderProps = {
  hasUnsavedChanges: boolean;
};

export function ProfileHeader({ hasUnsavedChanges }: ProfileHeaderProps) {
  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!hasUnsavedChanges) {
      return;
    }

    if (!window.confirm(PROFILE_LABELS.leaveConfirmation)) {
      event.preventDefault();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <span className={styles.eyebrow}>{PROFILE_LABELS.profileEyebrow}</span>
        <Typography.Title level={1} className={styles.title}>
          {PROFILE_LABELS.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {PROFILE_LABELS.subtitle}
        </Typography.Paragraph>
      </div>
      <Link href="/dashboard" className={styles.backLink} onClick={handleBackClick}>
        <ArrowLeftOutlined aria-hidden />
        <span>{PROFILE_LABELS.backButton}</span>
      </Link>
    </header>
  );
}
