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
            <div className={styles.recordTopline}>
              <span className={styles.recordBadge}>{RESULTS_LABELS.recordBadge}</span>
              <span className={styles.recordNumber} aria-hidden="true">
                01
              </span>
            </div>

            <div className={styles.recordMain}>
              <span className={styles.recordTime}>{item.timeText}</span>
              <h4 className={styles.recordAthlete}>{item.athlete}</h4>
            </div>

            <div className={styles.recordDetails}>
              {metaItems.length > 0 ? (
                <ul className={styles.recordMeta} role="list">
                  {metaItems.map((value, index) => (
                    <li key={`${item.id}-record-meta-${index}`}>{value}</li>
                  ))}
                </ul>
              ) : null}
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
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
