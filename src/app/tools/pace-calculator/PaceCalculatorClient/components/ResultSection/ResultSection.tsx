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

const RESULT_HELPER_ID = "pace-calculator-result-helper";

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
    <section className={styles.section} aria-labelledby="pace-calculator-result-title">
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle} id="pace-calculator-result-title">
          {PACE_CALCULATOR_TEXT.result.title}
        </h2>
        <button type="button" className={styles.saveButton} disabled={!canSave} onClick={onSave}>
          {PACE_CALCULATOR_TEXT.result.save}
        </button>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pace-result-time">
            {PACE_CALCULATOR_TEXT.result.resultLabel}
          </label>
          <TimeInput
            className={styles.timeInput}
            id="pace-result-time"
            placeholder="00:00:00"
            value={resultTime}
            onChange={onResultTimeChange}
            aria-describedby={RESULT_HELPER_ID}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pace-per-kilometer">
            {PACE_CALCULATOR_TEXT.result.paceLabel}
          </label>
          <TimeInput
            className={styles.timeInput}
            id="pace-per-kilometer"
            placeholder="00:00"
            value={paceTime}
            onChange={onPaceTimeChange}
            aria-describedby={RESULT_HELPER_ID}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pace-lap-time">
            {PACE_CALCULATOR_TEXT.result.lapLabel}
          </label>
          <TimeInput
            className={styles.timeInput}
            id="pace-lap-time"
            placeholder="00:00"
            value={lapTime}
            onChange={onLapTimeChange}
            aria-describedby={RESULT_HELPER_ID}
          />
        </div>
      </div>

      <p className={styles.helperNote} id={RESULT_HELPER_ID}>
        {PACE_CALCULATOR_TEXT.result.helper}
      </p>
    </section>
  );
}
