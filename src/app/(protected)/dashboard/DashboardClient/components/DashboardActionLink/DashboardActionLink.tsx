"use client";

import {
  ArrowRightOutlined,
  BookOutlined,
  CalendarOutlined,
  FlagOutlined,
  ShoppingOutlined,
  SnippetsOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardCardConfig, DashboardCardId } from "../../types/dashboardTypes";
import styles from "./DashboardActionLink.module.scss";

const DASHBOARD_CARD_ICONS = {
  users: <TeamOutlined />,
  invites: <UserAddOutlined />,
  templates: <SnippetsOutlined />,
  plan: <CalendarOutlined />,
  diary: <BookOutlined />,
  shoes: <ShoppingOutlined />,
  records: <TrophyOutlined />,
  competitions: <FlagOutlined />,
} satisfies Record<DashboardCardId, ReactNode>;

type DashboardActionLinkProps = {
  card: DashboardCardConfig;
};

export function DashboardActionLink({ card }: DashboardActionLinkProps) {
  return (
    <Link href={card.href} className={styles.link}>
      <span className={styles.icon} aria-hidden>
        {DASHBOARD_CARD_ICONS[card.id]}
      </span>
      <span className={styles.content}>
        <h3 className={styles.title}>{card.title}</h3>
        <span className={styles.description}>{card.description}</span>
      </span>
      <ArrowRightOutlined className={styles.arrow} aria-hidden />
    </Link>
  );
}
