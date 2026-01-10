import styles from "../pace-calculator.module.scss";

type ResultSectionProps = {
  resultHours: number;
  resultMinutes: number;
  resultSeconds: number;
  paceMinutes: number;
  paceSeconds: number;
  lapMinutes: number;
  lapSeconds: number;
  canSave: boolean;
  onSave: () => void;
  onResultHoursChange: React.ChangeEventHandler<HTMLInputElement>;
  onResultMinutesChange: React.ChangeEventHandler<HTMLInputElement>;
  onResultSecondsChange: React.ChangeEventHandler<HTMLInputElement>;
  onPaceMinutesChange: React.ChangeEventHandler<HTMLInputElement>;
  onPaceSecondsChange: React.ChangeEventHandler<HTMLInputElement>;
  onLapMinutesChange: React.ChangeEventHandler<HTMLInputElement>;
  onLapSecondsChange: React.ChangeEventHandler<HTMLInputElement>;
};

export function ResultSection({
  resultHours,
  resultMinutes,
  resultSeconds,
  paceMinutes,
  paceSeconds,
  lapMinutes,
  lapSeconds,
  canSave,
  onSave,
  onResultHoursChange,
  onResultMinutesChange,
  onResultSecondsChange,
  onPaceMinutesChange,
  onPaceSecondsChange,
  onLapMinutesChange,
  onLapSecondsChange,
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
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={resultHours}
              onChange={onResultHoursChange}
              aria-label="Часы"
            />
            <span className={styles.unit}>час</span>
          </div>
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={resultMinutes}
              onChange={onResultMinutesChange}
              aria-label="Минуты"
            />
            <span className={styles.unit}>мин</span>
          </div>
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={resultSeconds}
              onChange={onResultSecondsChange}
              aria-label="Секунды"
            />
            <span className={styles.unit}>сек</span>
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>Темп (мин/км):</span>
        <div className={styles.fields}>
          <div className={styles.fieldSpacer} aria-hidden="true" />
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={paceMinutes}
              onChange={onPaceMinutesChange}
              aria-label="Минуты на километр"
            />
            <span className={styles.unit}>мин</span>
          </div>
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={paceSeconds}
              onChange={onPaceSecondsChange}
              aria-label="Секунды на километр"
            />
            <span className={styles.unit}>сек</span>
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <span className={styles.rowLabel}>Время на круге (400 м):</span>
        <div className={styles.fields}>
          <div className={styles.fieldSpacer} aria-hidden="true" />
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={lapMinutes}
              onChange={onLapMinutesChange}
              aria-label="Минуты на круге"
            />
            <span className={styles.unit}>мин</span>
          </div>
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={lapSeconds}
              onChange={onLapSecondsChange}
              aria-label="Секунды на круге"
            />
            <span className={styles.unit}>сек</span>
          </div>
        </div>
      </div>

      <p className={styles.helperNote}>
        Если менять одно значение, то остальные значения пересчитываются автоматически
      </p>
    </div>
  );
}
