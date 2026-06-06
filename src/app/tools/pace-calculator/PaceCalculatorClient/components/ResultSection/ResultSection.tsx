import { TimeInput } from "@/components/inputs/TimeInput";
import { PACE_CALCULATOR_TEXT } from "../../constants/paceCalculatorConstants";
import styles from "./ResultSection.module.scss";

type ResultSectionProps = {
  resultTime: string;
  paceTime: string;
  lapTime: string;
  canSave: boolean;
  onSave: () => void;
  onResultTimeChange: (value: string) => void;
  onPaceTimeChange: (value: string) => void;
  onLapTimeChange: (value: string) => void;
};

export function ResultSection({
  resultTime,
  paceTime,
  lapTime,
  canSave,
  onSave,
  onResultTimeChange,
  onPaceTimeChange,
  onLapTimeChange,
}: ResultSectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>{PACE_CALCULATOR_TEXT.result.title}</h2>
        <button type="button" className={styles.saveButton} disabled={!canSave} onClick={onSave}>
          {PACE_CALCULATOR_TEXT.result.save}
        </button>
      </div>
      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>{PACE_CALCULATOR_TEXT.result.resultLabel}</span>
        <div className={styles.fields}>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={`${styles.input} ${styles.timeInputLarge}`}
              placeholder="00:00:00"
              value={resultTime}
              onChange={onResultTimeChange}
            />
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>{PACE_CALCULATOR_TEXT.result.paceLabel}</span>
        <div className={styles.fields}>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={`${styles.input} ${styles.timeInputMedium}`}
              placeholder="00:00"
              value={paceTime}
              onChange={onPaceTimeChange}
            />
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>{PACE_CALCULATOR_TEXT.result.lapLabel}</span>
        <div className={styles.fields}>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={`${styles.input} ${styles.timeInputMedium}`}
              placeholder="00:00"
              value={lapTime}
              onChange={onLapTimeChange}
            />
          </div>
        </div>
      </div>

      <p className={styles.helperNote}>{PACE_CALCULATOR_TEXT.result.helper}</p>
    </div>
  );
}
