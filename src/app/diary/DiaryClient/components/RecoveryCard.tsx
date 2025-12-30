"use client";

import { Button, Card, Checkbox, Input, InputNumber, Typography } from "antd";
import type { RecoveryForm } from "../types/diaryTypes";
import { normalizeStartTimeInput } from "../utils/diaryUtils";
import styles from "../diary.module.scss";

type RecoveryToggleField = "hasBath" | "hasMfr" | "hasMassage";
type RecoveryScoreField = "overallScore" | "functionalScore" | "muscleScore";

type RecoveryCardProps = {
  title: string;
  bathLabel: string;
  mfrLabel: string;
  massageLabel: string;
  overallLabel: string;
  functionalLabel: string;
  muscleLabel: string;
  sleepLabel: string;
  sleepPlaceholder: string;
  scorePlaceholder: string;
  saveLabel: string;
  recoveryForm: RecoveryForm;
  savingRecovery: boolean;
  onToggle: (field: RecoveryToggleField, checked: boolean) => void;
  onScoreChange: (field: RecoveryScoreField, value: number | null) => void;
  onSleepChange: (value: string) => void;
  onSave: () => void;
};

export function RecoveryCard({
  title,
  bathLabel,
  mfrLabel,
  massageLabel,
  overallLabel,
  functionalLabel,
  muscleLabel,
  sleepLabel,
  sleepPlaceholder,
  scorePlaceholder,
  saveLabel,
  recoveryForm,
  savingRecovery,
  onToggle,
  onScoreChange,
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
          <Typography.Text>{overallLabel}</Typography.Text>
          <InputNumber
            className={styles.recoveryInput}
            min={1}
            max={10}
            step={1}
            precision={0}
            placeholder={scorePlaceholder}
            value={recoveryForm.overallScore}
            onChange={(value) => onScoreChange("overallScore", value)}
          />
        </div>
        <div className={styles.recoveryField}>
          <Typography.Text>{functionalLabel}</Typography.Text>
          <InputNumber
            className={styles.recoveryInput}
            min={1}
            max={10}
            step={1}
            precision={0}
            placeholder={scorePlaceholder}
            value={recoveryForm.functionalScore}
            onChange={(value) => onScoreChange("functionalScore", value)}
          />
        </div>
        <div className={styles.recoveryField}>
          <Typography.Text>{muscleLabel}</Typography.Text>
          <InputNumber
            className={styles.recoveryInput}
            min={1}
            max={10}
            step={1}
            precision={0}
            placeholder={scorePlaceholder}
            value={recoveryForm.muscleScore}
            onChange={(value) => onScoreChange("muscleScore", value)}
          />
        </div>
        <div className={styles.recoveryField}>
          <Typography.Text>{sleepLabel}</Typography.Text>
          <Input
            className={styles.recoveryInput}
            maxLength={5}
            placeholder={sleepPlaceholder}
            value={recoveryForm.sleepHours}
            onChange={(event) =>
              onSleepChange(normalizeStartTimeInput(event.target.value))
            }
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
