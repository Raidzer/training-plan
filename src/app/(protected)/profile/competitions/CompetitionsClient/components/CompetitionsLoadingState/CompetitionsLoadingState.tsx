import { competitionsLabels } from "../../constants/competitionsConstants";
import styles from "./CompetitionsLoadingState.module.scss";

export function CompetitionsLoadingState() {
  return (
    <section
      className={styles.state}
      role="status"
      aria-busy="true"
      aria-label={competitionsLabels.loadingText}
    >
      <span className={styles.visuallyHidden}>{competitionsLabels.loadingDescription}</span>
      {Array.from({ length: 2 }, (_, index) => (
        <div className={styles.block} aria-hidden key={index}>
          <div className={styles.blockHeader}>
            <span className={styles.titleSkeleton} />
            <span className={styles.actionSkeleton} />
          </div>
          <span className={styles.periodSkeleton} />
          <div className={styles.rows}>
            <span />
            <span />
          </div>
        </div>
      ))}
    </section>
  );
}
