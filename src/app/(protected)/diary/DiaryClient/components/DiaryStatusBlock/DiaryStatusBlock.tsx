"use client";

import { FormOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { DayStatus } from "../../types/diaryTypes";
import styles from "./DiaryStatusBlock.module.scss";

type DiaryStatusLabels = {
  reportButton: string;
  dayComplete: string;
  dayIncomplete: string;
};

type DiaryStatusBlockProps = {
  dateLabel?: string;
  status: DayStatus | undefined;
  disabledReport: boolean;
  labels: DiaryStatusLabels;
  onOpenReport: () => void;
};

export function DiaryStatusBlock({
  dateLabel,
  status,
  disabledReport,
  labels,
  onOpenReport,
}: DiaryStatusBlockProps) {
  const resolvedDateLabel = dateLabel ?? status?.date ?? "";
  const dayComplete = Boolean(status?.dayHasReport);

  return (
    <section className={styles.statusPanel} aria-labelledby="selected-diary-date">
      <header className={styles.statusHeader}>
        <div className={styles.statusHeading}>
          <h2 id="selected-diary-date" className={styles.dateTitle}>
            {resolvedDateLabel}
          </h2>
          <p className={styles.dayStatus} data-complete={dayComplete}>
            {dayComplete ? labels.dayComplete : labels.dayIncomplete}
          </p>
        </div>
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
    </section>
  );
}
