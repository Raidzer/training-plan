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
    <section className={styles.page} aria-labelledby="results-page-title">
      <ResultsHeader totalResults={results.length} />
      <ResultsFilters
        activeDistance={activeDistance}
        activeGender={activeGender}
        onDistanceChange={setActiveDistance}
        onGenderChange={setActiveGender}
      />
      <ResultsPanel
        activeLabel={activeLabel}
        records={records}
        rest={rest}
        sortedResults={sortedResults}
      />
    </section>
  );
}
