"use client";

import { Card, Typography } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardCardConfig } from "../../types/dashboardTypes";
import styles from "./DashboardCard.module.scss";

type DashboardCardProps = {
  card: DashboardCardConfig;
  icon: ReactNode;
};

export function DashboardCard({ card, icon }: DashboardCardProps) {
  return (
    <Link href={card.href} className={styles.cardLink}>
      <Card
        hoverable
        className={styles.card}
        title={<DashboardCardTitle icon={icon} title={card.title} />}
      >
        <Typography.Text type="secondary">{card.description}</Typography.Text>
      </Card>
    </Link>
  );
}

function DashboardCardTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <span className={styles.cardTitle}>
      <span className={styles.cardTitleIcon}>{icon}</span>
      <Typography.Text strong className={styles.cardTitleText}>
        {title}
      </Typography.Text>
    </span>
  );
}
