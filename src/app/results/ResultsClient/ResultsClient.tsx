"use client";

import { ResultsFilters } from "./components/ResultsFilters/ResultsFilters";
import { ResultsHeader } from "./components/ResultsHeader/ResultsHeader";
import { ResultsPanel } from "./components/ResultsPanel/ResultsPanel";
import { useResultsFilters } from "./hooks/useResultsFilters";
import type { ResultsClientProps } from "./types/resultsTypes";
import styles from "./ResultsClient.module.scss";

export function ResultsClient({ results }: ResultsClientProps) {
  const {
    activeDistance,
    activeGender,
    activeLabel,
    records,
    rest,
    sortedResults,
    setActiveDistance,
    setActiveGender,
  } = useResultsFilters(results);

  return (
    <main className={styles.page}>
      <ResultsHeader />
      <ResultsFilters
        activeDistance={activeDistance}
        activeGender={activeGender}
        onDistanceChange={setActiveDistance}
        onGenderChange={setActiveGender}
      />
      <ResultsPanel
        activeDistance={activeDistance}
        activeLabel={activeLabel}
        records={records}
        rest={rest}
        sortedResults={sortedResults}
      />
    </main>
  );
}
