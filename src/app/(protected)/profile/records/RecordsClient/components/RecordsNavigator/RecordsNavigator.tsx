import type { ChangeEvent } from "react";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";
import { RECORD_GROUPS, RECORDS_LABELS } from "../../constants/recordsConstants";
import type { RecordFieldErrors, RecordRow } from "../../types/recordsTypes";
import { isRecordFilled, normalizeTimeText } from "../../utils/recordsUtils";
import styles from "./RecordsNavigator.module.scss";

type RecordsNavigatorProps = {
  rows: RecordRow[];
  selectedDistanceKey: PersonalRecordDistanceKey;
  errors: Record<string, RecordFieldErrors>;
  disabled: boolean;
  onSelect: (distanceKey: PersonalRecordDistanceKey) => void;
};

const getRowStatus = (row: RecordRow, rowErrors: RecordFieldErrors | undefined) => {
  if (rowErrors) {
    return RECORDS_LABELS.invalidStatus;
  }

  if (isRecordFilled(row)) {
    return RECORDS_LABELS.completedStatus;
  }

  return RECORDS_LABELS.emptyStatus;
};

export function RecordsNavigator({
  rows,
  selectedDistanceKey,
  errors,
  disabled,
  onSelect,
}: RecordsNavigatorProps) {
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelect(event.target.value as PersonalRecordDistanceKey);
  };

  return (
    <section className={styles.panel} aria-labelledby="records-navigator-title">
      <header className={styles.header}>
        <h2 id="records-navigator-title" className={styles.title}>
          {RECORDS_LABELS.navigatorTitle}
        </h2>
        <p className={styles.description}>{RECORDS_LABELS.navigatorDescription}</p>
      </header>

      <div className={styles.mobileSelector}>
        <label htmlFor="records-distance-select">{RECORDS_LABELS.mobileSelectorLabel}</label>
        <select
          id="records-distance-select"
          name="record-distance"
          value={selectedDistanceKey}
          onChange={handleSelectChange}
          disabled={disabled}
        >
          {rows.map((row) => {
            const time = normalizeTimeText(row.timeText);
            const status = errors[row.distanceKey]
              ? RECORDS_LABELS.invalidStatus
              : time || RECORDS_LABELS.emptyStatus;

            return (
              <option value={row.distanceKey} key={row.distanceKey}>
                {row.label} — {status}
              </option>
            );
          })}
        </select>
      </div>

      <nav className={styles.desktopNavigation} aria-label={RECORDS_LABELS.navigatorLabel}>
        {RECORD_GROUPS.map((group) => (
          <section
            className={styles.group}
            aria-labelledby={`record-group-${group.id}`}
            key={group.id}
          >
            <h3 id={`record-group-${group.id}`} className={styles.groupTitle}>
              {group.title}
            </h3>
            <ol className={styles.list}>
              {group.distanceKeys.map((distanceKey) => {
                const row = rows.find((item) => item.distanceKey === distanceKey);
                if (!row) {
                  return null;
                }

                const rowErrors = errors[row.distanceKey];
                const selected = row.distanceKey === selectedDistanceKey;
                const filled = isRecordFilled(row);
                const buttonClassName = [styles.recordButton, selected ? styles.selected : ""]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li className={styles.item} key={row.distanceKey}>
                    <button
                      type="button"
                      className={buttonClassName}
                      aria-current={selected ? "true" : undefined}
                      onClick={() => onSelect(row.distanceKey)}
                      disabled={disabled}
                    >
                      <span className={filled ? styles.markerFilled : styles.marker} aria-hidden />
                      <span className={styles.recordText}>
                        <span className={styles.distance}>{row.label}</span>
                        <span className={styles.status}>{getRowStatus(row, rowErrors)}</span>
                      </span>
                      <span className={styles.time}>{normalizeTimeText(row.timeText) || "—"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </nav>
    </section>
  );
}
