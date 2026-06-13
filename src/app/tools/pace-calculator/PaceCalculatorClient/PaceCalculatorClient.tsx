"use client";

import { PACE_CALCULATOR_TEXT } from "./constants/paceCalculatorConstants";
import { DistanceSection } from "./components/DistanceSection/DistanceSection";
import { ResultSection } from "./components/ResultSection/ResultSection";
import { SavedResultsList } from "./components/SavedResultsList/SavedResultsList";
import { SplitsPanel } from "./components/SplitsPanel/SplitsPanel";
import { usePaceCalculator } from "./hooks/usePaceCalculator";
import { formatMinutesSeconds, formatTime } from "./utils/paceCalculatorUtils";
import styles from "./PaceCalculatorClient.module.scss";

export function PaceCalculatorClient() {
  const {
    splits,
    splitGroups,
    savedResults,
    distanceInputValue,
    resultTimeString,
    paceTimeString,
    lapTimeString,
    canSave,
    handleDistanceChange,
    handleDistanceClear,
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
        <h1 className={styles.title}>{PACE_CALCULATOR_TEXT.header.title}</h1>
        <div className={styles.titleLine} />
        <p className={styles.description}>{PACE_CALCULATOR_TEXT.header.description}</p>
        <p className={styles.description}>{PACE_CALCULATOR_TEXT.header.hint}</p>
      </header>

      <div className={styles.calculatorGrid}>
        <div className={styles.panel}>
          <DistanceSection
            distanceInputValue={distanceInputValue}
            onDistanceChange={handleDistanceChange}
            onDistanceClear={handleDistanceClear}
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
