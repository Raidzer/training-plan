"use client";

import { EquivalentTable } from "./components/EquivalentTable/EquivalentTable";
import { InputPanel } from "./components/InputPanel/InputPanel";
import { RESULT_EQUIVALENT_TEXT } from "./constants/resultEquivalentConstants";
import { useResultEquivalent } from "./hooks/useResultEquivalent";
import styles from "./ResultEquivalentClient.module.scss";

export function ResultEquivalentClient() {
  const {
    sourceDistanceInputValue,
    sourceTime,
    predictionMethod,
    predictionMethodDescription,
    equivalents,
    handleSourceDistanceChange,
    handleSourceDistancePreset,
    handleSourceTimeChange,
    handlePredictionMethodChange,
  } = useResultEquivalent();

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{RESULT_EQUIVALENT_TEXT.header.title}</h1>
        <div className={styles.titleLine} />
        <p className={styles.description}>{RESULT_EQUIVALENT_TEXT.header.description}</p>
        <p className={styles.description}>{RESULT_EQUIVALENT_TEXT.header.hint}</p>
      </header>

      <div className={styles.calculatorGrid}>
        <InputPanel
          sourceDistanceInputValue={sourceDistanceInputValue}
          sourceTime={sourceTime}
          predictionMethod={predictionMethod}
          predictionMethodDescription={predictionMethodDescription}
          onSourceDistanceChange={handleSourceDistanceChange}
          onSourceDistancePreset={handleSourceDistancePreset}
          onSourceTimeChange={handleSourceTimeChange}
          onPredictionMethodChange={handlePredictionMethodChange}
        />
        <EquivalentTable equivalents={equivalents} />
      </div>
    </section>
  );
}
