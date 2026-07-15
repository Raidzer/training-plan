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
    <div className={styles.ranking}>
      <div className={styles.listHeader} aria-hidden="true">
        <span>{RESULTS_LABELS.rankColumn}</span>
        <span>{RESULTS_LABELS.athleteColumn}</span>
        <span>{RESULTS_LABELS.timeColumn}</span>
        <span>{RESULTS_LABELS.protocolColumn}</span>
      </div>

      <ol className={styles.resultsList} start={recordsCount + 1} role="list">
        {results.map((item, index) => {
          const rank = recordsCount + index + 1;
          const metaItems = buildMetaItems(item);

          return (
            <li className={styles.resultRow} key={item.id}>
              <span className={styles.rankBadge} aria-label={`${rank} место`}>
                {String(rank).padStart(2, "0")}
              </span>

              <div className={styles.resultBody}>
                <span className={styles.resultAthlete}>{item.athlete}</span>
                {metaItems.length > 0 ? (
                  <ul className={styles.resultMeta} role="list">
                    {metaItems.map((value, metaIndex) => (
                      <li key={`${item.id}-meta-${metaIndex}`}>{value}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <span className={styles.resultTime}>{item.timeText}</span>

              {item.protocolUrl ? (
                <a
                  className={styles.protocolLink}
                  href={item.protocolUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Открыть протокол: ${item.athlete}, ${item.timeText}, результат №${item.id}`}
                >
                  {RESULTS_LABELS.protocolLink}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className={styles.emptyProtocol} aria-hidden="true">
                  —
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
