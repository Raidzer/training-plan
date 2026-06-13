import { DISTANCE_PRESETS, PACE_CALCULATOR_TEXT } from "../../constants/paceCalculatorConstants";
import styles from "./DistanceSection.module.scss";

type DistanceSectionProps = {
  distanceInputValue: string;
  onDistanceChange: React.ChangeEventHandler<HTMLInputElement>;
  onDistancePreset: (value: number) => void;
};

export function DistanceSection({
  distanceInputValue,
  onDistanceChange,
  onDistancePreset,
}: DistanceSectionProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{PACE_CALCULATOR_TEXT.distance.title}</h2>
      <p className={styles.sectionHint}>{PACE_CALCULATOR_TEXT.distance.hint}</p>
      <div className={styles.distanceControls}>
        <div className={styles.fieldGroup}>
          <input
            className={`${styles.input} ${styles.inputWide}`}
            type="number"
            min={0}
            step={1}
            value={distanceInputValue}
            onChange={onDistanceChange}
            aria-label={PACE_CALCULATOR_TEXT.distance.ariaLabel}
          />
          <span className={styles.unit}>{PACE_CALCULATOR_TEXT.distance.unit}</span>
        </div>
        <div className={styles.presetRow}>
          {DISTANCE_PRESETS.map((preset) => (
            <button
              type="button"
              className={styles.presetButton}
              onClick={() => onDistancePreset(preset.value)}
              key={preset.value}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
