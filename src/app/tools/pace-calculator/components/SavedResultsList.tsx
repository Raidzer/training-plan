import styles from "../pace-calculator.module.scss";
import type { SavedResult } from "../pace-calculator.types";

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
        <h2 className={styles.sectionTitle}>Сохраненные результаты</h2>
      </div>
      {results.length === 0 ? (
        <p className={styles.emptyState}>Пока нет сохраненных результатов.</p>
      ) : (
        <ul className={styles.savedList}>
          {results.map((item) => (
            <li className={styles.savedItem} key={item.id}>
              <div className={styles.savedMain}>
                <span className={styles.savedDistance}>
                  {getDistanceLabel(item.distanceMeters)}
                </span>
                <span className={styles.savedResult}>
                  Результат: {formatTime(item.resultSeconds)}
                </span>
                <span className={styles.savedMeta}>
                  Темп: {formatMinutesSeconds(item.paceSeconds)} / км
                </span>
                <span className={styles.savedMeta}>
                  Круг 400 м: {formatMinutesSeconds(item.lapSeconds)}
                </span>
              </div>
              <div className={styles.savedActions}>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => onDelete(item.id)}
                >
                  Удалить
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
