"use client";

import { type FormEvent, useId } from "react";
import { Button, Input } from "antd";
import type { SavingWeightState, WeightFormState } from "../../types/diaryTypes";
import styles from "./WeightCard.module.scss";

type WeightCardProps = {
  title: string;
  morningPlaceholder: string;
  eveningPlaceholder: string;
  saveLabel: string;
  weightForm: WeightFormState;
  savingWeight: SavingWeightState;
  onChange: (period: "morning" | "evening", value: string) => void;
  onSave: (period: "morning" | "evening") => void;
};

export function WeightCard({
  title,
  morningPlaceholder,
  eveningPlaceholder,
  saveLabel,
  weightForm,
  savingWeight,
  onChange,
  onSave,
}: WeightCardProps) {
  const cardId = useId();
  const titleId = `${cardId}-title`;
  const morningInputId = `${cardId}-morning`;
  const eveningInputId = `${cardId}-evening`;

  const handleWeightSubmit = (period: "morning" | "evening", event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(period);
  };

  return (
    <section className={styles.sectionPanel} aria-labelledby={titleId}>
      <div className={styles.sectionHeader}>
        <h3 id={titleId} className={styles.sectionTitle}>
          {title}
        </h3>
      </div>
      <div className={styles.weightGrid}>
        <form
          className={styles.weightForm}
          onSubmit={(event) => handleWeightSubmit("morning", event)}
        >
          <label className={styles.fieldLabel} htmlFor={morningInputId}>
            {morningPlaceholder}
          </label>
          <div className={styles.weightRow}>
            <Input
              id={morningInputId}
              name="weightMorning"
              inputMode="decimal"
              autoComplete="off"
              value={weightForm.morning}
              placeholder={morningPlaceholder}
              onChange={(event) => onChange("morning", event.target.value)}
            />
            <Button type="primary" htmlType="submit" loading={savingWeight.morning}>
              {saveLabel}
            </Button>
          </div>
        </form>
        <form
          className={styles.weightForm}
          onSubmit={(event) => handleWeightSubmit("evening", event)}
        >
          <label className={styles.fieldLabel} htmlFor={eveningInputId}>
            {eveningPlaceholder}
          </label>
          <div className={styles.weightRow}>
            <Input
              id={eveningInputId}
              name="weightEvening"
              inputMode="decimal"
              autoComplete="off"
              value={weightForm.evening}
              placeholder={eveningPlaceholder}
              onChange={(event) => onChange("evening", event.target.value)}
            />
            <Button type="primary" htmlType="submit" loading={savingWeight.evening}>
              {saveLabel}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
