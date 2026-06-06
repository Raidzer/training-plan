"use client";

import { Card, Typography } from "antd";
import { PERIOD_SUMMARY_ITEMS } from "../../constants/periodConstants";
import type { PeriodTotals } from "../../types/periodTypes";
import styles from "./PeriodSummaryCards.module.scss";

type PeriodSummaryCardsProps = {
  totals: PeriodTotals;
};

export function PeriodSummaryCards({ totals }: PeriodSummaryCardsProps) {
  return (
    <div className={styles.summaryRow}>
      {PERIOD_SUMMARY_ITEMS.map((item) => (
        <Card className={styles.summaryCard} key={item.key}>
          <Typography.Text type="secondary">{item.label}</Typography.Text>
          <Typography.Title level={4}>{totals[item.key]}</Typography.Title>
        </Card>
      ))}
    </div>
  );
}
