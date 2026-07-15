"use client";

import { type FormEvent, useId } from "react";
import { Button, Checkbox, Input } from "antd";
import { RECOVERY_LABELS } from "../../constants/diaryConstants";
import type { RecoveryForm } from "../../types/diaryTypes";
import { normalizeStartTimeInput } from "../../utils/diaryUtils";
import styles from "./RecoveryCard.module.scss";

type RecoveryToggleField = "hasBath" | "hasMfr" | "hasMassage";

type RecoveryCardProps = {
  title: string;
  bathLabel: string;
  mfrLabel: string;
  massageLabel: string;
  otherLabel: string;
  otherPlaceholder: string;
  sleepLabel: string;
  sleepPlaceholder: string;
  additionalSleepLabel: string;
  additionalSleepPlaceholder: string;
  saveLabel: string;
  recoveryForm: RecoveryForm;
  savingRecovery: boolean;
  onToggle: (field: RecoveryToggleField, checked: boolean) => void;
  onOtherChange: (value: string) => void;
  onSleepChange: (value: string) => void;
  onAdditionalSleepChange: (value: string) => void;
  onSave: () => void;
};

export function RecoveryCard({
  title,
  bathLabel,
  mfrLabel,
  massageLabel,
  otherLabel,
  otherPlaceholder,
  sleepLabel,
  sleepPlaceholder,
  additionalSleepLabel,
  additionalSleepPlaceholder,
  saveLabel,
  recoveryForm,
  savingRecovery,
  onToggle,
  onOtherChange,
  onSleepChange,
  onAdditionalSleepChange,
  onSave,
}: RecoveryCardProps) {
  const cardId = useId();
  const titleId = `${cardId}-title`;
  const otherInputId = `${cardId}-other`;
  const sleepInputId = `${cardId}-sleep`;
  const additionalSleepInputId = `${cardId}-additional-sleep`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave();
  };

  return (
    <section className={styles.sectionPanel} aria-labelledby={titleId}>
      <div className={styles.sectionHeader}>
        <h3 id={titleId} className={styles.sectionTitle}>
          {title}
        </h3>
      </div>
      <form className={styles.recoveryForm} onSubmit={handleSubmit}>
        <fieldset className={styles.recoveryMethods}>
          <legend className={styles.methodsLegend}>{RECOVERY_LABELS.methodsLabel}</legend>
          <div className={styles.recoveryGrid}>
            <Checkbox
              name="hasBath"
              checked={recoveryForm.hasBath}
              onChange={(event) => onToggle("hasBath", event.target.checked)}
            >
              {bathLabel}
            </Checkbox>
            <Checkbox
              name="hasMfr"
              checked={recoveryForm.hasMfr}
              onChange={(event) => onToggle("hasMfr", event.target.checked)}
            >
              {mfrLabel}
            </Checkbox>
            <Checkbox
              name="hasMassage"
              checked={recoveryForm.hasMassage}
              onChange={(event) => onToggle("hasMassage", event.target.checked)}
            >
              {massageLabel}
            </Checkbox>
          </div>
        </fieldset>
        <div className={styles.recoveryScores}>
          <div className={styles.recoveryField}>
            <label className={styles.fieldLabel} htmlFor={otherInputId}>
              {otherLabel}
            </label>
            <Input
              id={otherInputId}
              name="recoveryOther"
              className={styles.recoveryInput}
              maxLength={255}
              placeholder={otherPlaceholder}
              value={recoveryForm.recoveryOther}
              onChange={(event) => onOtherChange(event.target.value)}
            />
          </div>
          <div className={styles.sleepFields}>
            <div className={styles.recoveryField}>
              <label className={styles.fieldLabel} htmlFor={sleepInputId}>
                {sleepLabel}
              </label>
              <Input
                id={sleepInputId}
                name="sleepHours"
                className={styles.recoveryInput}
                inputMode="numeric"
                maxLength={5}
                placeholder={sleepPlaceholder}
                value={recoveryForm.sleepHours}
                onChange={(event) => onSleepChange(normalizeStartTimeInput(event.target.value))}
              />
            </div>
            <div className={styles.recoveryField}>
              <label className={styles.fieldLabel} htmlFor={additionalSleepInputId}>
                {additionalSleepLabel}
              </label>
              <Input
                id={additionalSleepInputId}
                name="additionalSleepHours"
                className={styles.recoveryInput}
                inputMode="numeric"
                maxLength={5}
                placeholder={additionalSleepPlaceholder}
                value={recoveryForm.additionalSleepHours}
                onChange={(event) =>
                  onAdditionalSleepChange(normalizeStartTimeInput(event.target.value))
                }
              />
            </div>
          </div>
        </div>
        <div className={styles.recoveryActions}>
          <Button type="primary" htmlType="submit" loading={savingRecovery}>
            {saveLabel}
          </Button>
        </div>
      </form>
    </section>
  );
}
