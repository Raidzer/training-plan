"use client";

import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { DIARY_PERIOD_LABELS } from "../../constants/periodConstants";
import styles from "./PeriodStatusBadge.module.scss";

type PeriodStatusBadgeProps = {
  completed: boolean;
};

export function PeriodStatusBadge({ completed }: PeriodStatusBadgeProps) {
  const label = completed
    ? DIARY_PERIOD_LABELS.completedStatus
    : DIARY_PERIOD_LABELS.incompleteStatus;

  return (
    <span className={styles.statusBadge}>
      {completed ? (
        <CheckCircleOutlined className={styles.icon} aria-hidden />
      ) : (
        <ClockCircleOutlined className={styles.icon} aria-hidden />
      )}
      <span>{label}</span>
    </span>
  );
}
