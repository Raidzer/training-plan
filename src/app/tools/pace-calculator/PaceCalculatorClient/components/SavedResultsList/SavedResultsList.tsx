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

export function SavedResultsList({
  results,
  onDelete,
  formatTime,
  formatMinutesSeconds,
  getDistanceLabel,
}: SavedResultsListProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>{PACE_CALCULATOR_TEXT.savedResults.title}</h2>
      </div>
      {results.length === 0 ? (
        <p className={styles.emptyState}>{PACE_CALCULATOR_TEXT.savedResults.empty}</p>
      ) : (
        <ul className={styles.savedList}>
          {results.map((item) => (
            <li className={styles.savedItem} key={item.id}>
              <div className={styles.savedMain}>
                <span className={styles.savedDistance}>
                  {getDistanceLabel(item.distanceMeters)}
                </span>
                <span className={styles.savedResult}>
                  {PACE_CALCULATOR_TEXT.savedResults.result} {formatTime(item.resultSeconds)}
                </span>
                <span className={styles.savedMeta}>
                  {PACE_CALCULATOR_TEXT.savedResults.pace} {formatMinutesSeconds(item.paceSeconds)}{" "}
                  {PACE_CALCULATOR_TEXT.savedResults.paceUnit}
                </span>
                <span className={styles.savedMeta}>
                  {PACE_CALCULATOR_TEXT.savedResults.lap} {formatMinutesSeconds(item.lapSeconds)}
                </span>
              </div>
              <div className={styles.savedActions}>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => onDelete(item.id)}
                >
                  {PACE_CALCULATOR_TEXT.savedResults.delete}
                </button>
                <span className={styles.savedTimestamp}>
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
