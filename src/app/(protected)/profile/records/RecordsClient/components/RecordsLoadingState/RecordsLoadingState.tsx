import { RECORDS_LABELS } from "../../constants/recordsConstants";
import styles from "./RecordsLoadingState.module.scss";

export function RecordsLoadingState() {
  return (
    <section className={styles.state} aria-busy="true" aria-label={RECORDS_LABELS.loadingText}>
      <div className={styles.navigatorSkeleton} aria-hidden>
        <span className={styles.headingSkeleton} />
        <span className={styles.textSkeleton} />
        <div className={styles.rowSkeletons}>
          {Array.from({ length: 5 }, (_, index) => (
            <span className={styles.rowSkeleton} key={index} />
          ))}
        </div>
      </div>
      <div className={styles.editorSkeleton} aria-hidden>
        <span className={styles.headingSkeleton} />
        <span className={styles.previewSkeleton} />
        <span className={styles.guideSkeleton} />
        <div className={styles.fieldsSkeleton}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <span className={styles.visuallyHidden}>{RECORDS_LABELS.loadingDescription}</span>
    </section>
  );
}
