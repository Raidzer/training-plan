"use client";

import {
  BookOutlined,
  CalendarOutlined,
  FlagOutlined,
  ShoppingOutlined,
  SnippetsOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { DASHBOARD_CARDS } from "../../constants/dashboardConstants";
import type { DashboardCardId } from "../../types/dashboardTypes";
import { DashboardCard } from "../DashboardCard/DashboardCard";
import styles from "./DashboardCards.module.scss";

const DASHBOARD_CARD_ICONS = {
  admin: <TeamOutlined />,
  templates: <SnippetsOutlined />,
  plan: <CalendarOutlined />,
  diary: <BookOutlined />,
  shoes: <ShoppingOutlined />,
  records: <TrophyOutlined />,
  competitions: <FlagOutlined />,
} satisfies Record<DashboardCardId, ReactNode>;

type DashboardCardsProps = {
  isAdmin: boolean;
};

export function DashboardCards({ isAdmin }: DashboardCardsProps) {
  const cards = DASHBOARD_CARDS.filter((card) => !card.adminOnly || isAdmin);

  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <DashboardCard card={card} icon={DASHBOARD_CARD_ICONS[card.id]} key={card.id} />
      ))}
    </div>
  );
}
