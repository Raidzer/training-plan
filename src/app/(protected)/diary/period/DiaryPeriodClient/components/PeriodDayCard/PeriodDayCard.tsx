"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { DIARY_PERIOD_LABELS } from "../../constants/periodConstants";
import type { DayStatus } from "../../types/periodTypes";
import {
  formatDistanceMetric,
  formatPeriodDisplayDate,
  formatRecoveryStatus,
  formatWeightStatus,
  formatWorkoutStatus,
} from "../../utils/periodUtils";
import { PeriodStatusBadge } from "../PeriodStatusBadge/PeriodStatusBadge";
import styles from "./PeriodDayCard.module.scss";

type PeriodDayCardProps = {
  day: DayStatus;
};

export function PeriodDayCard({ day }: PeriodDayCardProps) {
  const displayDate = formatPeriodDisplayDate(day.date);

  return (
    <article className={styles.periodDayCard}>
      <div className={styles.periodDayHeader}>
        <Link
          className={styles.dateLink}
          href={"/diary?date=" + day.date}
          aria-label={DIARY_PERIOD_LABELS.openDayAction + ": " + displayDate}
        >
          <span>{displayDate}</span>
          <ArrowRightOutlined aria-hidden />
        </Link>
        <PeriodStatusBadge completed={day.dayHasReport} />
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
          label={DIARY_PERIOD_LABELS.sleepColumn}
          value={
            day.hasSleep ? DIARY_PERIOD_LABELS.sleepCompleted : DIARY_PERIOD_LABELS.sleepMissing
          }
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
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}
