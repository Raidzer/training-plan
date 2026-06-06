"use client";

import { RESULTS_LABELS } from "../../constants/resultsConstants";
import type { ResultsEntry } from "../../types/resultsTypes";
import { buildMetaItems } from "../../utils/resultsUtils";
import styles from "./ResultsList.module.scss";

type ResultsListProps = {
  recordsCount: number;
  results: ResultsEntry[];
};

export function ResultsList({ recordsCount, results }: ResultsListProps) {
  return (
    <ol className={styles.resultsList}>
      {results.map((item, index) => {
        const rank = recordsCount + index + 1;
        const metaItems = buildMetaItems(item);

        return (
          <li className={styles.resultRow} key={item.id}>
            <div className={styles.rankBadge}>#{rank}</div>
            <div className={styles.resultBody}>
              <div className={styles.resultHeader}>
                <span className={styles.resultTime}>{item.timeText}</span>
                <span className={styles.resultAthlete}>{item.athlete}</span>
              </div>
              <div className={styles.resultMeta}>
                {metaItems.map((value, metaIndex) => (
                  <span key={`${item.id}-meta-${metaIndex}`}>{value}</span>
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
            </div>
          </li>
        );
      })}
    </ol>
  );
}
