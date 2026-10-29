import type { ShoeItem } from "../../types/shoesTypes";
import { shoesLabels } from "../../constants/shoesConstants";
import styles from "./ShoesOverview.module.scss";

type ShoesOverviewProps = {
  items: ShoeItem[];
  loading: boolean;
  loadError: boolean;
};

export function ShoesOverview({ items, loading, loadError }: ShoesOverviewProps) {
  const activeItems = items.filter((item) => !item.isArchived);
  const limitedPairs = activeItems.filter((item) => item.mileageLimitKm !== null).length;
  const notifiedPairs = activeItems.filter(
    (item) => item.notifyOnLimitEmail || item.notifyOnLimitTelegram
  ).length;
  const renderValue = (count: number) => {
    if (!loading && !loadError) {
      return String(count);
    }

    return (
      <>
        <span aria-hidden>—</span>
        <span className={styles.visuallyHidden}>
          {loadError ? shoesLabels.overviewUnavailable : shoesLabels.overviewLoading}
        </span>
      </>
    );
  };

  return (
    <section className={styles.overview} aria-label={shoesLabels.overviewLabel} aria-busy={loading}>
      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>{shoesLabels.totalPairsLabel}</dt>
          <dd>{renderValue(activeItems.length)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{shoesLabels.limitedPairsLabel}</dt>
          <dd>{renderValue(limitedPairs)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{shoesLabels.notifiedPairsLabel}</dt>
          <dd>{renderValue(notifiedPairs)}</dd>
        </div>
      </dl>
    </section>
  );
}
