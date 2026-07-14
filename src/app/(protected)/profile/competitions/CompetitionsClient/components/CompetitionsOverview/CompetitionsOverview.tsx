import { competitionsLabels } from "../../constants/competitionsConstants";
import type { CompetitionBlockItem } from "../../types/competitionsTypes";
import { getCompetitionsOverviewStats } from "../../utils/competitionsUtils";
import styles from "./CompetitionsOverview.module.scss";

type CompetitionsOverviewProps = {
  blocks: CompetitionBlockItem[];
  loading: boolean;
  loadError: boolean;
};

export function CompetitionsOverview({ blocks, loading, loadError }: CompetitionsOverviewProps) {
  const stats = getCompetitionsOverviewStats(blocks);

  const renderValue = (value: number) => {
    if (!loading && !loadError) {
      return String(value);
    }

    return (
      <>
        <span aria-hidden>—</span>
        <span className={styles.visuallyHidden}>
          {loadError ? competitionsLabels.overviewUnavailable : competitionsLabels.overviewLoading}
        </span>
      </>
    );
  };

  return (
    <section
      className={styles.overview}
      aria-label={competitionsLabels.overviewLabel}
      aria-busy={loading}
    >
      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>{competitionsLabels.totalBlocksLabel}</dt>
          <dd>{renderValue(stats.totalBlocks)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{competitionsLabels.totalCompetitionsLabel}</dt>
          <dd>{renderValue(stats.totalCompetitions)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{competitionsLabels.mainCompetitionsLabel}</dt>
          <dd>{renderValue(stats.mainCompetitions)}</dd>
        </div>
      </dl>
    </section>
  );
}
