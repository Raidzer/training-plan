"use client";

import { Button, Card, Checkbox, Input, Typography } from "antd";
import type { RecoveryForm } from "../types/diaryTypes";
import { normalizeStartTimeInput } from "../utils/diaryUtils";
import styles from "../diary.module.scss";

type RecoveryToggleField = "hasBath" | "hasMfr" | "hasMassage";

type RecoveryCardProps = {
  title: string;
  bathLabel: string;
  mfrLabel: string;
  massageLabel: string;
  sleepLabel: string;
  sleepPlaceholder: string;
  saveLabel: string;
  recoveryForm: RecoveryForm;
  savingRecovery: boolean;
  onToggle: (field: RecoveryToggleField, checked: boolean) => void;
  onSleepChange: (value: string) => void;
  onSave: () => void;
};

export function RecoveryCard({
  title,
  bathLabel,
  mfrLabel,
  massageLabel,
  sleepLabel,
  sleepPlaceholder,
  saveLabel,
  recoveryForm,
  savingRecovery,
  onToggle,
  onSleepChange,
  onSave,
}: RecoveryCardProps) {
  return (
    <Card type="inner" title={title}>
      <div className={styles.recoveryGrid}>
        <Checkbox
          checked={recoveryForm.hasBath}
          onChange={(event) => onToggle("hasBath", event.target.checked)}
        >
          {bathLabel}
        </Checkbox>
        <Checkbox
          checked={recoveryForm.hasMfr}
          onChange={(event) => onToggle("hasMfr", event.target.checked)}
        >
          {mfrLabel}
        </Checkbox>
        <Checkbox
          checked={recoveryForm.hasMassage}
          onChange={(event) => onToggle("hasMassage", event.target.checked)}
        >
          {massageLabel}
        </Checkbox>
      </div>
      <div className={styles.recoveryScores}>
        <div className={styles.recoveryField}>
          <Typography.Text>{sleepLabel}</Typography.Text>
          <Input
            className={styles.recoveryInput}
            maxLength={5}
            placeholder={sleepPlaceholder}
            value={recoveryForm.sleepHours}
            onChange={(event) => onSleepChange(normalizeStartTimeInput(event.target.value))}
          />
        </div>
      </div>
      <div className={styles.recoveryActions}>
        <Button type="primary" loading={savingRecovery} onClick={onSave}>
          {saveLabel}
        </Button>
      </div>
    </Card>
  );
}
