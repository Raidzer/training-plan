import { TEMPLATES_LABELS } from "../../constants/templatesConstants";
import type { TemplatesOverviewStats } from "../../types/templatesTypes";
import styles from "./TemplatesOverview.module.scss";

type TemplatesOverviewProps = {
  stats: TemplatesOverviewStats;
};

export function TemplatesOverview({ stats }: TemplatesOverviewProps) {
  return (
    <section className={styles.overview} aria-label={TEMPLATES_LABELS.overviewLabel}>
      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>{TEMPLATES_LABELS.totalTemplatesLabel}</dt>
          <dd>{stats.total}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{TEMPLATES_LABELS.userTemplatesLabel}</dt>
          <dd>{stats.user}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{TEMPLATES_LABELS.systemTemplatesLabel}</dt>
          <dd>{stats.system}</dd>
        </div>
      </dl>
    </section>
  );
}
