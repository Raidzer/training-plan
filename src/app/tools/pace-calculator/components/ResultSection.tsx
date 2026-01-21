import { TimeInput } from "@/app/profile/records/TimeInput";
import styles from "../pace-calculator.module.scss";

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
        <h2 className={styles.sectionTitle}>Результат:</h2>
        <button type="button" className={styles.saveButton} disabled={!canSave} onClick={onSave}>
          Сохранить результат
        </button>
      </div>
      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>Результат:</span>
        <div className={styles.fields}>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={styles.input}
              placeholder="00:00:00"
              value={resultTime}
              onChange={onResultTimeChange}
              style={{ width: 120, textAlign: "center" }}
            />
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>Темп (мин/км):</span>
        <div className={styles.fields}>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={styles.input}
              placeholder="00:00"
              value={paceTime}
              onChange={onPaceTimeChange}
              style={{ width: 100, textAlign: "center" }}
            />
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>Время на круге (400 м):</span>
        <div className={styles.fields}>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={styles.input}
              placeholder="00:00"
              value={lapTime}
              onChange={onLapTimeChange}
              style={{ width: 100, textAlign: "center" }}
            />
          </div>
        </div>
      </div>

      <p className={styles.helperNote}>
        Если менять одно значение, то остальные значения пересчитываются автоматически
      </p>
    </div>
  );
}
