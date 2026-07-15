"use client";

import { PACE_CALCULATOR_TEXT } from "./constants/paceCalculatorConstants";
import { DistanceSection } from "./components/DistanceSection/DistanceSection";
import { ResultSection } from "./components/ResultSection/ResultSection";
import { SavedResultsList } from "./components/SavedResultsList/SavedResultsList";
import { SplitsPanel } from "./components/SplitsPanel/SplitsPanel";
import { usePaceCalculator } from "./hooks/usePaceCalculator";
import { formatMinutesSeconds, formatTime } from "./utils/paceCalculatorUtils";
import styles from "./PaceCalculatorClient.module.scss";

type PaceCalculatorClientProps = {
  showIntro?: boolean;
};

export function PaceCalculatorClient({ showIntro = true }: PaceCalculatorClientProps) {
  const {
    splits,
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
    <div className={styles.page}>
      {showIntro ? (
        <header className={styles.header}>
          <p className={styles.eyebrow}>{PACE_CALCULATOR_TEXT.header.eyebrow}</p>
          <h1 className={styles.title}>{PACE_CALCULATOR_TEXT.header.title}</h1>
          <p className={styles.description}>{PACE_CALCULATOR_TEXT.header.description}</p>
          <p className={styles.description}>{PACE_CALCULATOR_TEXT.header.hint}</p>
        </header>
      ) : null}

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
        <SplitsPanel splits={splits} />
      </div>

      <SavedResultsList
        results={savedResults}
        onDelete={handleDeleteResult}
        formatTime={formatTime}
        formatMinutesSeconds={formatMinutesSeconds}
        getDistanceLabel={getSavedDistanceLabel}
      />
    </div>
  );
}
