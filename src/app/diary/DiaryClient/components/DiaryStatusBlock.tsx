"use client";

import { Button, Tag } from "antd";
import type { DayStatus } from "../types/diaryTypes";
import styles from "../diary.module.scss";

type DiaryStatusLabels = {
  reportButton: string;
  dayComplete: string;
  dayIncomplete: string;
  weightLabel: string;
  weightMorningShort: string;
  weightEveningShort: string;
  workoutsLabel: string;
};

type DiaryStatusBlockProps = {
  status: DayStatus | undefined;
  workoutsComplete: boolean;
  disabledReport: boolean;
  labels: DiaryStatusLabels;
  onOpenReport: () => void;
};

export function DiaryStatusBlock({
  status,
  workoutsComplete,
  disabledReport,
  labels,
  onOpenReport,
}: DiaryStatusBlockProps) {
  return (
    <>
      <div className={styles.statusRow}>
        <Button type="primary" onClick={onOpenReport} disabled={disabledReport}>
          {labels.reportButton}
        </Button>
      </div>
      <div className={styles.statusRow}>
        {status?.dayHasReport ? (
          <Tag color="green">{labels.dayComplete}</Tag>
        ) : (
          <Tag>{labels.dayIncomplete}</Tag>
        )}
        <Tag color={status?.hasWeightMorning && status?.hasWeightEvening ? "green" : "default"}>
          {labels.weightLabel}: {status?.hasWeightMorning ? labels.weightMorningShort : "-"} /{" "}
          {status?.hasWeightEvening ? labels.weightEveningShort : "-"}
        </Tag>
        <Tag color={workoutsComplete ? "green" : "orange"}>
          {labels.workoutsLabel}: {status?.workoutsWithFullReport ?? 0}/{status?.workoutsTotal ?? 0}
        </Tag>
      </div>
    </>
  );
}
