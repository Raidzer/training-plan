import { TimeInput } from "@/components/inputs/TimeInput";
import { CloseCircleFilled } from "@ant-design/icons";
import { Segmented } from "antd";
import {
  DISTANCE_PRESETS,
  PREDICTION_METHODS,
  RESULT_EQUIVALENT_TEXT,
} from "../../constants/resultEquivalentConstants";
import type { PredictionMethod } from "../../types/resultEquivalentTypes";
import styles from "./InputPanel.module.scss";

type InputPanelProps = {
  sourceDistanceInputValue: string;
  sourceTime: string;
  predictionMethod: PredictionMethod;
  predictionMethodDescription: string;
  onSourceDistanceChange: React.ChangeEventHandler<HTMLInputElement>;
  onSourceDistanceClear: () => void;
  onSourceDistancePreset: (value: number) => void;
  onSourceTimeChange: (value: string) => void;
  onPredictionMethodChange: (value: PredictionMethod) => void;
};

export function InputPanel({
  sourceDistanceInputValue,
  sourceTime,
  predictionMethod,
  predictionMethodDescription,
  onSourceDistanceChange,
  onSourceDistanceClear,
  onSourceDistancePreset,
  onSourceTimeChange,
  onPredictionMethodChange,
}: InputPanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.sectionTitle}>{RESULT_EQUIVALENT_TEXT.input.title}</h2>

      <div className={styles.inputStack}>
        <div className={styles.inputRow}>
          <div className={styles.labelBlock}>
            <span className={styles.rowLabel}>{RESULT_EQUIVALENT_TEXT.input.distanceLabel}</span>
            <span className={styles.rowHint}>{RESULT_EQUIVALENT_TEXT.input.distanceHint}</span>
          </div>
          <div className={styles.distanceControls}>
            <div className={styles.fieldGroup}>
              <input
                className={`${styles.input} ${styles.distanceInput}`}
                type="number"
                min={0}
                step={1}
                value={sourceDistanceInputValue}
                onChange={onSourceDistanceChange}
                aria-label={RESULT_EQUIVALENT_TEXT.input.distanceAriaLabel}
              />
              {sourceDistanceInputValue && (
                <button
                  className={styles.clearButton}
                  type="button"
                  aria-label={RESULT_EQUIVALENT_TEXT.input.distanceClear}
                  title={RESULT_EQUIVALENT_TEXT.input.distanceClear}
                  onClick={onSourceDistanceClear}
                >
                  <CloseCircleFilled aria-hidden="true" />
                </button>
              )}
              <span className={styles.unit}>{RESULT_EQUIVALENT_TEXT.input.distanceUnit}</span>
            </div>
            <div className={styles.presetRow}>
              {DISTANCE_PRESETS.map((preset) => (
                <button
                  type="button"
                  className={styles.presetButton}
                  onClick={() => onSourceDistancePreset(preset.value)}
                  key={preset.value}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.inputRow}>
          <div className={styles.labelBlock}>
            <span className={styles.rowLabel}>{RESULT_EQUIVALENT_TEXT.input.resultLabel}</span>
          </div>
          <div className={styles.fieldGroup}>
            <TimeInput
              className={`${styles.input} ${styles.timeInput}`}
              placeholder="00:00:00"
              value={sourceTime}
              onChange={onSourceTimeChange}
              allowClear
              aria-label={RESULT_EQUIVALENT_TEXT.input.resultAriaLabel}
            />
          </div>
        </div>

        <div className={`${styles.inputRow} ${styles.methodRow}`}>
          <div className={styles.labelBlock}>
            <span className={styles.rowLabel}>{RESULT_EQUIVALENT_TEXT.input.methodLabel}</span>
          </div>
          <div className={styles.methodControls}>
            <Segmented
              aria-label={RESULT_EQUIVALENT_TEXT.input.methodAriaLabel}
              block
              value={predictionMethod}
              options={PREDICTION_METHODS.map((method) => ({
                label: method.label,
                value: method.value,
              }))}
              onChange={(value) => onPredictionMethodChange(value as PredictionMethod)}
            />
            <span className={styles.methodDescription}>{predictionMethodDescription}</span>
          </div>
        </div>
      </div>

      <p className={styles.formulaNote}>{RESULT_EQUIVALENT_TEXT.input.formulaNote}</p>
    </div>
  );
}
