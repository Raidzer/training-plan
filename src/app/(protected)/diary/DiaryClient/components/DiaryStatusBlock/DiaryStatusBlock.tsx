"use client";

import {
  DashboardOutlined,
  FileDoneOutlined,
  FormOutlined,
  MoonOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { STATUS_LABELS } from "../../constants/diaryConstants";
import type { DayStatus } from "../../types/diaryTypes";
import styles from "./DiaryStatusBlock.module.scss";

type DiaryStatusLabels = {
  reportButton: string;
  dayComplete: string;
  dayIncomplete: string;
  weightLabel: string;
  weightMorningShort: string;
  weightEveningShort: string;
  sleepLabel: string;
  sleepFilledShort: string;
  sleepEmptyShort: string;
  workoutsLabel: string;
};

type DiaryStatusBlockProps = {
  dateLabel?: string;
  status: DayStatus | undefined;
  workoutsComplete: boolean;
  disabledReport: boolean;
  labels: DiaryStatusLabels;
  onOpenReport: () => void;
};

export function DiaryStatusBlock({
  dateLabel,
  status,
  workoutsComplete,
  disabledReport,
  labels,
  onOpenReport,
}: DiaryStatusBlockProps) {
  const resolvedDateLabel = dateLabel ?? status?.date ?? "";
  const weightComplete = Boolean(status?.hasWeightMorning && status?.hasWeightEvening);
  const sleepComplete = Boolean(status?.hasSleep);
  const dayComplete = Boolean(status?.dayHasReport);

  return (
    <section className={styles.statusPanel} aria-labelledby="selected-diary-date">
      <header className={styles.statusHeader}>
        <h2 id="selected-diary-date" className={styles.dateTitle}>
          {resolvedDateLabel}
        </h2>
        <Button
          className={styles.reportButton}
          type="primary"
          icon={<FormOutlined aria-hidden="true" />}
          onClick={onOpenReport}
          disabled={disabledReport}
        >
          {labels.reportButton}
        </Button>
      </header>

      <ul className={styles.statusGrid} role="list">
        <li className={styles.statusItem} data-complete={dayComplete}>
          <FileDoneOutlined className={styles.statusIcon} aria-hidden="true" />
          <span className={styles.statusText}>
            <span className={styles.statusLabel}>{STATUS_LABELS.dayStatusLabel}</span>
            <span className={styles.statusValue}>
              {dayComplete ? labels.dayComplete : labels.dayIncomplete}
            </span>
          </span>
        </li>
        <li className={styles.statusItem} data-complete={weightComplete}>
          <DashboardOutlined className={styles.statusIcon} aria-hidden="true" />
          <span className={styles.statusText}>
            <span className={styles.statusLabel}>{labels.weightLabel}</span>
            <span className={styles.statusValue}>
              {labels.weightMorningShort}:{" "}
              {status?.hasWeightMorning ? labels.sleepFilledShort : "—"}
              <span aria-hidden="true"> · </span>
              {labels.weightEveningShort}:{" "}
              {status?.hasWeightEvening ? labels.sleepFilledShort : "—"}
            </span>
          </span>
        </li>
        <li className={styles.statusItem} data-complete={sleepComplete}>
          <MoonOutlined className={styles.statusIcon} aria-hidden="true" />
          <span className={styles.statusText}>
            <span className={styles.statusLabel}>{labels.sleepLabel}</span>
            <span className={styles.statusValue}>
              {sleepComplete ? labels.sleepFilledShort : labels.sleepEmptyShort}
            </span>
          </span>
        </li>
        <li className={styles.statusItem} data-complete={workoutsComplete}>
          <ThunderboltOutlined className={styles.statusIcon} aria-hidden="true" />
          <span className={styles.statusText}>
            <span className={styles.statusLabel}>{labels.workoutsLabel}</span>
            <span className={styles.statusValue}>
              {status?.workoutsWithFullReport ?? 0}/{status?.workoutsTotal ?? 0}
            </span>
          </span>
        </li>
      </ul>
    </section>
  );
}
