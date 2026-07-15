"use client";

import { RESULTS_LABELS, RESULTS_PANEL_ID } from "../../constants/resultsConstants";
import type { ResultsEntry } from "../../types/resultsTypes";
import { formatResultsCount } from "../../utils/resultsUtils";
import { RecordCards } from "../RecordCards/RecordCards";
import { ResultsList } from "../ResultsList/ResultsList";
import styles from "./ResultsPanel.module.scss";

type ResultsPanelProps = {
  activeLabel: string;
  records: ResultsEntry[];
  rest: ResultsEntry[];
  sortedResults: ResultsEntry[];
};

export function ResultsPanel({ activeLabel, records, rest, sortedResults }: ResultsPanelProps) {
  return (
    <section className={styles.panel} id={RESULTS_PANEL_ID} aria-labelledby="results-panel-title">
      <div className={styles.panelHeader}>
        <div className={styles.panelCopy}>
          <p className={styles.panelEyebrow}>{RESULTS_LABELS.panelEyebrow}</p>
          <h2 className={styles.panelTitle} id="results-panel-title">
            {RESULTS_LABELS.panelTitlePrefix} {activeLabel}
          </h2>
          <p className={styles.panelSubtitle}>{RESULTS_LABELS.panelSubtitle}</p>
        </div>
        <output className={styles.resultCount} aria-live="polite" aria-atomic="true">
          {formatResultsCount(sortedResults.length)}
        </output>
      </div>

      {sortedResults.length === 0 ? (
        <div className={styles.empty} role="status">
          <strong>{RESULTS_LABELS.emptyTitle}</strong>
          <p>{RESULTS_LABELS.emptyText}</p>
          <p>{RESULTS_LABELS.emptyGuidance}</p>
        </div>
      ) : (
        <>
          <section className={styles.section} aria-labelledby="results-records-title">
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle} id="results-records-title">
                {RESULTS_LABELS.recordsTitle}
              </h3>
              <p className={styles.sectionSubtitle}>{RESULTS_LABELS.recordsSubtitle}</p>
            </div>
            <RecordCards records={records} />
          </section>

          {rest.length > 0 ? (
            <section className={styles.section} aria-labelledby="results-ranking-title">
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle} id="results-ranking-title">
                  {RESULTS_LABELS.restTitle}
                </h3>
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
