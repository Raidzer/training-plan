"use client";

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
  return (
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
      <div className={styles.weightGrid}>
        <div className={styles.weightRow}>
          <Input
            value={weightForm.morning}
            placeholder={morningPlaceholder}
            onChange={(event) => onChange("morning", event.target.value)}
          />
          <Button type="primary" loading={savingWeight.morning} onClick={() => onSave("morning")}>
            {saveLabel}
          </Button>
        </div>
        <div className={styles.weightRow}>
          <Input
            value={weightForm.evening}
            placeholder={eveningPlaceholder}
            onChange={(event) => onChange("evening", event.target.value)}
          />
          <Button type="primary" loading={savingWeight.evening} onClick={() => onSave("evening")}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
