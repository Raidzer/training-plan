import { useEffect, useRef } from "react";
import { PACE_CALCULATOR_TEXT } from "../../constants/paceCalculatorConstants";
import type { SavedResult } from "../../types/paceCalculatorTypes";
import styles from "./SavedResultsList.module.scss";

type SavedResultsListProps = {
  results: SavedResult[];
  onDelete: (id: string) => void;
  formatTime: (seconds: number) => string;
  formatMinutesSeconds: (seconds: number) => string;
  getDistanceLabel: (meters: number) => string;
};

const SAVED_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

export function SavedResultsList({
  results,
  onDelete,
  formatTime,
  formatMinutesSeconds,
  getDistanceLabel,
}: SavedResultsListProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savedListRef = useRef<HTMLUListElement>(null);
  const pendingFocusIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const pendingFocusIndex = pendingFocusIndexRef.current;
    if (pendingFocusIndex === null) {
      return;
    }

    const deleteButtons = savedListRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const nextFocusIndex = Math.min(pendingFocusIndex, (deleteButtons?.length ?? 1) - 1);
    const nextButton = nextFocusIndex >= 0 ? deleteButtons?.item(nextFocusIndex) : null;

    if (nextButton) {
      nextButton.focus();
    } else {
      headingRef.current?.focus();
    }

    pendingFocusIndexRef.current = null;
  }, [results]);

  function handleDelete(id: string, index: number) {
    pendingFocusIndexRef.current = index;
    onDelete(id);
  }

  return (
    <section className={styles.panel} aria-labelledby="saved-pace-results-title">
      <div className={styles.sectionHeaderRow}>
        <div>
          <p className={styles.sectionIndex}>Сравнение</p>
          <h2
            ref={headingRef}
            className={styles.sectionTitle}
            id="saved-pace-results-title"
            tabIndex={-1}
          >
            {PACE_CALCULATOR_TEXT.savedResults.title}
          </h2>
        </div>
        <span className={styles.resultsCount} aria-label={`Сохранено расчётов: ${results.length}`}>
          {String(results.length).padStart(2, "0")}
        </span>
      </div>

      {results.length === 0 ? (
        <p className={styles.emptyState}>{PACE_CALCULATOR_TEXT.savedResults.empty}</p>
      ) : (
        <ul ref={savedListRef} className={styles.savedList} role="list">
          {results.map((item, index) => {
            const distanceLabel = getDistanceLabel(item.distanceMeters);
            const formattedDate = SAVED_DATE_FORMATTER.format(new Date(item.createdAt));

            return (
              <li className={styles.savedItem} key={item.id}>
                <div className={styles.savedHeader}>
                  <span className={styles.savedDistance}>{distanceLabel}</span>
                  <time className={styles.savedTimestamp} dateTime={item.createdAt}>
                    {formattedDate}
                  </time>
                </div>

                <dl className={styles.metrics}>
                  <div className={styles.primaryMetric}>
                    <dt>{PACE_CALCULATOR_TEXT.savedResults.result}</dt>
                    <dd>{formatTime(item.resultSeconds)}</dd>
                  </div>
                  <div>
                    <dt>{PACE_CALCULATOR_TEXT.savedResults.pace}</dt>
                    <dd>
                      {formatMinutesSeconds(item.paceSeconds)}{" "}
                      {PACE_CALCULATOR_TEXT.savedResults.paceUnit}
                    </dd>
                  </div>
                  <div>
                    <dt>{PACE_CALCULATOR_TEXT.savedResults.lap}</dt>
                    <dd>{formatMinutesSeconds(item.lapSeconds)}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`${PACE_CALCULATOR_TEXT.savedResults.delete}: расчёт ${index + 1}, ${distanceLabel}, ${formattedDate}`}
                  onClick={() => handleDelete(item.id, index)}
                >
                  {PACE_CALCULATOR_TEXT.savedResults.delete}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
