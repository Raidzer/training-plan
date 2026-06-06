"use client";

import { RESULTS_LABELS, RESULTS_PANEL_ID } from "../../constants/resultsConstants";
import type { ResultsDistanceKey, ResultsEntry } from "../../types/resultsTypes";
import { RecordCards } from "../RecordCards/RecordCards";
import { ResultsList } from "../ResultsList/ResultsList";
import styles from "./ResultsPanel.module.scss";

type ResultsPanelProps = {
  activeDistance: ResultsDistanceKey;
  activeLabel: string;
  records: ResultsEntry[];
  rest: ResultsEntry[];
  sortedResults: ResultsEntry[];
};

export function ResultsPanel({
  activeDistance,
  activeLabel,
  records,
  rest,
  sortedResults,
}: ResultsPanelProps) {
  return (
    <section
      className={styles.panel}
      id={RESULTS_PANEL_ID}
      role="tabpanel"
      aria-labelledby={`results-tab-${activeDistance}`}
    >
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          {RESULTS_LABELS.panelTitlePrefix} {activeLabel}
        </h2>
        <p className={styles.panelSubtitle}>{RESULTS_LABELS.panelSubtitle}</p>
      </div>

      {sortedResults.length === 0 ? (
        <p className={styles.empty}>{RESULTS_LABELS.emptyText}</p>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>{RESULTS_LABELS.recordsTitle}</h3>
              <p className={styles.sectionSubtitle}>{RESULTS_LABELS.recordsSubtitle}</p>
            </div>
            <RecordCards records={records} />
          </section>

          {rest.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{RESULTS_LABELS.restTitle}</h3>
                <p className={styles.sectionSubtitle}>{RESULTS_LABELS.restSubtitle}</p>
              </div>
              <ResultsList recordsCount={records.length} results={rest} />
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
