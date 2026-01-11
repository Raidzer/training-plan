"use client";

import styles from "./pace-calculator.module.scss";
import { formatMinutesSeconds, formatTime } from "./pace-calculator.utils";
import { DistanceSection } from "./components/DistanceSection";
import { ResultSection } from "./components/ResultSection";
import { SavedResultsList } from "./components/SavedResultsList";
import { SplitsPanel } from "./components/SplitsPanel";
import { usePaceCalculator } from "./usePaceCalculator";

export function PaceCalculatorClient() {
  const {
    distance,
    splits,
    splitGroups,
    savedResults,
    resultTimeString,
    paceTimeString,
    lapTimeString,
    canSave,
    handleDistanceChange,
    handleDistancePreset,
    handleResultTimeChange,
    handlePaceTimeChange,
    handleLapTimeChange,
    handleSaveResult,
    handleDeleteResult,
    getSavedDistanceLabel,
  } = usePaceCalculator();

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Калькулятор расчета темпа и результата на забеге</h1>
        <div className={styles.titleLine} />
        <p className={styles.description}>
          Калькулятор для расчета темпа бега в зависимости от результата и времени бега в
          зависимости от темпа. Раскладка времени по километрам. Удобное сохранение нескольких
          результатов.
        </p>
        <p className={styles.description}>
          Просто введите дистанцию и впишите темп или результат. Воспользуйтесь кнопкой Сохранить
          результат для сохранения результата для последующего сравнения.
        </p>
      </header>

      <div className={styles.calculatorGrid}>
        <div className={styles.panel}>
          <DistanceSection
            distance={distance}
            onDistanceChange={handleDistanceChange}
            onDistancePreset={handleDistancePreset}
          />
          <div className={styles.sectionDivider} />
          <ResultSection
            resultTime={resultTimeString}
            paceTime={paceTimeString}
            lapTime={lapTimeString}
            canSave={canSave}
            onSave={handleSaveResult}
            onResultTimeChange={handleResultTimeChange}
            onPaceTimeChange={handlePaceTimeChange}
            onLapTimeChange={handleLapTimeChange}
          />
        </div>
        <SplitsPanel splits={splits} splitGroups={splitGroups} />
      </div>

      <SavedResultsList
        results={savedResults}
        onDelete={handleDeleteResult}
        formatTime={formatTime}
        formatMinutesSeconds={formatMinutesSeconds}
        getDistanceLabel={getSavedDistanceLabel}
      />
    </section>
  );
}
