"use client";

import { RESULTS_LABELS } from "../../constants/resultsConstants";
import type { ResultsEntry } from "../../types/resultsTypes";
import { buildMetaItems } from "../../utils/resultsUtils";
import styles from "./RecordCards.module.scss";

type RecordCardsProps = {
  records: ResultsEntry[];
};

export function RecordCards({ records }: RecordCardsProps) {
  return (
    <div className={styles.recordsGrid}>
      {records.map((item) => {
        const metaItems = buildMetaItems(item);

        return (
          <article className={styles.recordCard} key={item.id}>
            <span className={styles.recordBadge}>{RESULTS_LABELS.recordBadge}</span>
            <div className={styles.recordMain}>
              <span className={styles.recordTime}>{item.timeText}</span>
              <span className={styles.recordAthlete}>{item.athlete}</span>
            </div>
            <div className={styles.recordMeta}>
              {metaItems.map((value, index) => (
                <span key={`${item.id}-record-meta-${index}`}>{value}</span>
              ))}
              {item.protocolUrl ? (
                <a
                  className={styles.protocolLink}
                  href={item.protocolUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {RESULTS_LABELS.protocolLink}
                </a>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
