"use client";

import { EquivalentTable } from "./components/EquivalentTable/EquivalentTable";
import { InputPanel } from "./components/InputPanel/InputPanel";
import { RESULT_EQUIVALENT_TEXT } from "./constants/resultEquivalentConstants";
import { useResultEquivalent } from "./hooks/useResultEquivalent";
import styles from "./ResultEquivalentClient.module.scss";

type ResultEquivalentClientProps = {
  showIntro?: boolean;
};

export function ResultEquivalentClient({ showIntro = true }: ResultEquivalentClientProps) {
  const {
    sourceDistanceInputValue,
    sourceTime,
    predictionMethod,
    predictionMethodDescription,
    equivalents,
    handleSourceDistanceChange,
    handleSourceDistanceClear,
    handleSourceDistancePreset,
    handleSourceTimeChange,
    handlePredictionMethodChange,
  } = useResultEquivalent();

  return (
    <div className={styles.page}>
      {showIntro ? (
        <header className={styles.header}>
          <p className={styles.eyebrow}>{RESULT_EQUIVALENT_TEXT.header.eyebrow}</p>
          <h1 className={styles.title}>{RESULT_EQUIVALENT_TEXT.header.title}</h1>
          <p className={styles.description}>{RESULT_EQUIVALENT_TEXT.header.description}</p>
          <p className={styles.description}>{RESULT_EQUIVALENT_TEXT.header.hint}</p>
        </header>
      ) : null}

      <div className={styles.calculatorGrid}>
        <InputPanel
          sourceDistanceInputValue={sourceDistanceInputValue}
          sourceTime={sourceTime}
          predictionMethod={predictionMethod}
          predictionMethodDescription={predictionMethodDescription}
          onSourceDistanceChange={handleSourceDistanceChange}
          onSourceDistanceClear={handleSourceDistanceClear}
          onSourceDistancePreset={handleSourceDistancePreset}
          onSourceTimeChange={handleSourceTimeChange}
          onPredictionMethodChange={handlePredictionMethodChange}
        />
        <EquivalentTable equivalents={equivalents} />
      </div>
    </div>
  );
}
