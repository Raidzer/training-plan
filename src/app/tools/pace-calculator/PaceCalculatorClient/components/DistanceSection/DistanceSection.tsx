import { CloseOutlined } from "@ant-design/icons";
import { useRef } from "react";
import {
  DISTANCE_PRESETS,
  MAX_DISTANCE_METERS,
  PACE_CALCULATOR_TEXT,
} from "../../constants/paceCalculatorConstants";
import styles from "./DistanceSection.module.scss";

type DistanceSectionProps = {
  distanceInputValue: string;
  onDistanceChange: React.ChangeEventHandler<HTMLInputElement>;
  onDistanceClear: () => void;
  onDistancePreset: (value: number) => void;
};

const DISTANCE_INPUT_ID = "pace-calculator-distance";
const DISTANCE_HINT_ID = "pace-calculator-distance-hint";

export function DistanceSection({
  distanceInputValue,
  onDistanceChange,
  onDistanceClear,
  onDistancePreset,
}: DistanceSectionProps) {
  const distanceInputRef = useRef<HTMLInputElement>(null);
  const selectedDistance = Number(distanceInputValue);

  function handleDistanceClear() {
    onDistanceClear();
    distanceInputRef.current?.focus();
  }

  return (
    <fieldset className={styles.section}>
      <legend className={styles.sectionTitle}>{PACE_CALCULATOR_TEXT.distance.title}</legend>
      <p className={styles.sectionHint} id={DISTANCE_HINT_ID}>
        {PACE_CALCULATOR_TEXT.distance.hint}
      </p>

      <div className={styles.distanceControls}>
        <label className={styles.fieldLabel} htmlFor={DISTANCE_INPUT_ID}>
          {PACE_CALCULATOR_TEXT.distance.fieldLabel}
        </label>
        <div className={styles.fieldGroup}>
          <input
            ref={distanceInputRef}
            className={styles.input}
            id={DISTANCE_INPUT_ID}
            type="number"
            min={0}
            max={MAX_DISTANCE_METERS}
            step={1}
            inputMode="numeric"
            value={distanceInputValue}
            onChange={onDistanceChange}
            aria-describedby={DISTANCE_HINT_ID}
          />
          <span className={styles.unit}>{PACE_CALCULATOR_TEXT.distance.unit}</span>
          {distanceInputValue ? (
            <button
              className={styles.clearButton}
              type="button"
              aria-label={PACE_CALCULATOR_TEXT.distance.clear}
              title={PACE_CALCULATOR_TEXT.distance.clear}
              onClick={handleDistanceClear}
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className={styles.presetRow} aria-label="Популярные дистанции" role="group">
          {DISTANCE_PRESETS.map((preset) => {
            const isSelected = selectedDistance === preset.value;

            return (
              <button
                type="button"
                className={styles.presetButton}
                aria-pressed={isSelected}
                onClick={() => onDistancePreset(preset.value)}
                key={preset.value}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
