"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import Link from "next/link";
import { AdminCompetitionBlocks } from "./components/AdminCompetitionBlocks/AdminCompetitionBlocks";
import { ADMIN_USER_COMPETITIONS_LABELS } from "./constants/adminUserCompetitionsConstants";
import type { AdminUserCompetitionsContentProps } from "./types/adminUserCompetitionsTypes";
import styles from "./AdminUserCompetitionsPage.module.scss";

export function AdminUserCompetitionsContent({
  userLabel,
  blocks,
}: AdminUserCompetitionsContentProps) {
  return (
    <main className={styles.page}>
      <div className={styles.actions}>
        <Link href="/admin/users">
          <Button icon={<ArrowLeftOutlined />}>{ADMIN_USER_COMPETITIONS_LABELS.backToUsers}</Button>
        </Link>
      </div>

      <div className={styles.header}>
        <Typography.Title level={3} className={styles.title}>
          {ADMIN_USER_COMPETITIONS_LABELS.titlePrefix}: {userLabel}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {ADMIN_USER_COMPETITIONS_LABELS.subtitle}
        </Typography.Paragraph>
      </div>

      <AdminCompetitionBlocks blocks={blocks} />
    </main>
  );
}
