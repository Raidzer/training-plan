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
    resultHours,
    resultMinutes,
    resultSeconds,
    paceMinutes,
    paceSeconds,
    lapMinutes,
    lapSeconds,
    splits,
    splitGroups,
    savedResults,
    canSave,
    handleDistanceChange,
    handleDistancePreset,
    handleResultHoursChange,
    handleResultMinutesChange,
    handleResultSecondsChange,
    handlePaceMinutesChange,
    handlePaceSecondsChange,
    handleLapMinutesChange,
    handleLapSecondsChange,
    handleSaveResult,
    handleDeleteResult,
    getSavedDistanceLabel,
  } = usePaceCalculator();

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Калькулятор расчета темпа и результата на забеге
        </h1>
        <div className={styles.titleLine} />
        <p className={styles.description}>
          Калькулятор для расчета темпа бега в зависимости от результата и
          времени бега в зависимости от темпа. Раскладка времени по километрам.
          Удобное сохранение нескольких результатов.
        </p>
        <p className={styles.description}>
          Просто введите дистанцию и впишите темп или результат. Воспользуйтесь
          кнопкой Сохранить результат для сохранения результата для последующего
          сравнения.
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
            resultHours={resultHours}
            resultMinutes={resultMinutes}
            resultSeconds={resultSeconds}
            paceMinutes={paceMinutes}
            paceSeconds={paceSeconds}
            lapMinutes={lapMinutes}
            lapSeconds={lapSeconds}
            canSave={canSave}
            onSave={handleSaveResult}
            onResultHoursChange={handleResultHoursChange}
            onResultMinutesChange={handleResultMinutesChange}
            onResultSecondsChange={handleResultSecondsChange}
            onPaceMinutesChange={handlePaceMinutesChange}
            onPaceSecondsChange={handlePaceSecondsChange}
            onLapMinutesChange={handleLapMinutesChange}
            onLapSecondsChange={handleLapSecondsChange}
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
