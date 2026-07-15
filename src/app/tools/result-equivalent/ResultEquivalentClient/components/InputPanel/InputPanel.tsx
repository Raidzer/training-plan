import { CloseOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { TimeInput } from "@/components/inputs/TimeInput";
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

const DISTANCE_HINT_ID = "equivalent-distance-hint";
const METHOD_DESCRIPTION_ID = "equivalent-method-description";

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
  const distanceInputRef = useRef<HTMLInputElement>(null);
  const selectedDistance = Number(sourceDistanceInputValue);

  function handleDistanceClear() {
    onSourceDistanceClear();
    distanceInputRef.current?.focus();
  }

  return (
    <section className={styles.panel} aria-labelledby="equivalent-input-title">
      <div className={styles.panelHeader}>
        <p className={styles.panelIndex}>Исходные данные</p>
        <h2 className={styles.sectionTitle} id="equivalent-input-title">
          {RESULT_EQUIVALENT_TEXT.input.title}
        </h2>
      </div>

      <div className={styles.inputStack}>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="equivalent-distance">
            {RESULT_EQUIVALENT_TEXT.input.distanceLabel}
          </label>
          <span className={styles.rowHint} id={DISTANCE_HINT_ID}>
            {RESULT_EQUIVALENT_TEXT.input.distanceHint}
          </span>

          <div className={styles.fieldGroup}>
            <input
              ref={distanceInputRef}
              className={styles.distanceInput}
              id="equivalent-distance"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={sourceDistanceInputValue}
              onChange={onSourceDistanceChange}
              aria-describedby={DISTANCE_HINT_ID}
            />
            <span className={styles.unit}>{RESULT_EQUIVALENT_TEXT.input.distanceUnit}</span>
            {sourceDistanceInputValue ? (
              <button
                className={styles.clearButton}
                type="button"
                aria-label={RESULT_EQUIVALENT_TEXT.input.distanceClear}
                title={RESULT_EQUIVALENT_TEXT.input.distanceClear}
                onClick={handleDistanceClear}
              >
                <CloseOutlined aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className={styles.presetRow} aria-label="Популярные исходные дистанции" role="group">
            {DISTANCE_PRESETS.map((preset) => (
              <button
                type="button"
                className={styles.presetButton}
                aria-pressed={selectedDistance === preset.value}
                onClick={() => onSourceDistancePreset(preset.value)}
                key={preset.value}
              >
                {preset.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="equivalent-result-time">
            {RESULT_EQUIVALENT_TEXT.input.resultLabel}
          </label>
          <TimeInput
            className={styles.timeInput}
            id="equivalent-result-time"
            placeholder="00:00:00"
            value={sourceTime}
            onChange={onSourceTimeChange}
          />
        </div>

        <fieldset className={styles.methodFieldset}>
          <legend className={styles.fieldLabel}>{RESULT_EQUIVALENT_TEXT.input.methodLabel}</legend>
          <div className={styles.methodButtons}>
            {PREDICTION_METHODS.map((method) => (
              <button
                type="button"
                className={styles.methodButton}
                aria-pressed={predictionMethod === method.value}
                aria-describedby={METHOD_DESCRIPTION_ID}
                onClick={() => onPredictionMethodChange(method.value)}
                key={method.value}
              >
                {method.label}
              </button>
            ))}
          </div>
          <p className={styles.methodDescription} id={METHOD_DESCRIPTION_ID} aria-live="polite">
            {predictionMethodDescription}
          </p>
        </fieldset>
      </div>

      <p className={styles.formulaNote}>{RESULT_EQUIVALENT_TEXT.input.formulaNote}</p>
    </section>
  );
}
