"use client";

import { Tag, Typography } from "antd";
import { DIARY_PERIOD_LABELS } from "../../constants/periodConstants";
import type { DayStatus } from "../../types/periodTypes";
import {
  formatDistanceMetric,
  formatPeriodDisplayDate,
  formatRecoveryStatus,
  formatWeightStatus,
  formatWorkoutStatus,
} from "../../utils/periodUtils";
import styles from "./PeriodDayCard.module.scss";

type PeriodDayCardProps = {
  day: DayStatus;
};

export function PeriodDayCard({ day }: PeriodDayCardProps) {
  return (
    <article className={styles.periodDayCard}>
      <div className={styles.periodDayHeader}>
        <div>
          <Typography.Text strong>{formatPeriodDisplayDate(day.date)}</Typography.Text>
        </div>
        {day.dayHasReport ? (
          <Tag color="green">{DIARY_PERIOD_LABELS.completedStatus}</Tag>
        ) : (
          <Tag>{DIARY_PERIOD_LABELS.incompleteStatus}</Tag>
        )}
      </div>
      <div className={styles.periodDayGrid}>
        <Metric
          label={DIARY_PERIOD_LABELS.weightColumn}
          value={formatWeightStatus(day.hasWeightMorning, day.hasWeightEvening)}
        />
        <Metric
          label={DIARY_PERIOD_LABELS.distanceMetric}
          value={formatDistanceMetric(day.totalDistanceKm)}
        />
        <Metric
          label={DIARY_PERIOD_LABELS.recoveryColumn}
          value={formatRecoveryStatus(day.hasBath, day.hasMfr, day.hasMassage)}
        />
        <Metric
          label={DIARY_PERIOD_LABELS.workoutsColumn}
          value={formatWorkoutStatus(day.workoutsWithFullReport, day.workoutsTotal)}
        />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text>{value}</Typography.Text>
    </div>
  );
}
