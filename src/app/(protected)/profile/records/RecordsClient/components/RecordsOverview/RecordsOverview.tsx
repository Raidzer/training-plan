import { RECORDS_LABELS } from "../../constants/recordsConstants";
import type { RecordRow } from "../../types/recordsTypes";
import { getRecordsOverviewStats } from "../../utils/recordsUtils";
import styles from "./RecordsOverview.module.scss";

type RecordsOverviewProps = {
  rows: RecordRow[];
  loading: boolean;
  loadError: boolean;
};

export function RecordsOverview({ rows, loading, loadError }: RecordsOverviewProps) {
  const stats = getRecordsOverviewStats(rows);
  const renderValue = (value: number) => {
    if (!loading && !loadError) {
      return String(value);
    }

    return (
      <>
        <span aria-hidden>—</span>
        <span className={styles.visuallyHidden}>
          {loadError ? RECORDS_LABELS.loadErrorTitle : RECORDS_LABELS.loadingText}
        </span>
      </>
    );
  };

  return (
    <section
      className={styles.overview}
      aria-label={RECORDS_LABELS.overviewLabel}
      aria-busy={loading}
    >
      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>{RECORDS_LABELS.totalDistancesLabel}</dt>
          <dd>{renderValue(stats.totalDistances)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{RECORDS_LABELS.completedRecordsLabel}</dt>
          <dd>{renderValue(stats.completedRecords)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{RECORDS_LABELS.protocolsLabel}</dt>
          <dd>{renderValue(stats.recordsWithProtocol)}</dd>
        </div>
      </dl>
    </section>
  );
}
