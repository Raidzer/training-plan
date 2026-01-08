import styles from "../pace-calculator.module.scss";

type DistanceSectionProps = {
  distance: number;
  onDistanceChange: React.ChangeEventHandler<HTMLInputElement>;
  onDistancePreset: (value: number) => void;
};

export function DistanceSection({
  distance,
  onDistanceChange,
  onDistancePreset,
}: DistanceSectionProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Дистанция:</h2>
      <p className={styles.sectionHint}>
        Впишите дистанцию или нажмите на кнопку с нужной дистанцией
      </p>
      <div className={styles.distanceControls}>
        <div className={styles.fieldGroup}>
          <input
            className={`${styles.input} ${styles.inputWide}`}
            type="number"
            min={0}
            step={1}
            value={distance}
            onChange={onDistanceChange}
            aria-label="Дистанция в метрах"
          />
          <span className={styles.unit}>м</span>
        </div>
        <div className={styles.presetRow}>
          <button
            type="button"
            className={styles.presetButton}
            onClick={() => onDistancePreset(1000)}
          >
            1 000 м
          </button>
          <button
            type="button"
            className={styles.presetButton}
            onClick={() => onDistancePreset(3000)}
          >
            3 000 м
          </button>
          <button
            type="button"
            className={styles.presetButton}
            onClick={() => onDistancePreset(5000)}
          >
            5 000 м
          </button>
          <button
            type="button"
            className={styles.presetButton}
            onClick={() => onDistancePreset(10000)}
          >
            10 000 м
          </button>
          <button
            type="button"
            className={styles.presetButton}
            onClick={() => onDistancePreset(21097)}
          >
            21 097 м
          </button>
          <button
            type="button"
            className={styles.presetButton}
            onClick={() => onDistancePreset(42195)}
          >
            42 195 м
          </button>
        </div>
      </div>
    </div>
  );
}
