import { ADMIN_USERS_LABELS } from "../../constants/adminUsersConstants";
import type { AdminUsersStats } from "../../types/adminUsersTypes";
import styles from "./AdminUsersOverview.module.scss";

type AdminUsersOverviewProps = {
  stats: AdminUsersStats;
};

export function AdminUsersOverview({ stats }: AdminUsersOverviewProps) {
  const metrics = [
    { label: ADMIN_USERS_LABELS.totalUsersMetric, value: stats.total },
    { label: ADMIN_USERS_LABELS.activeUsersMetric, value: stats.active },
    { label: ADMIN_USERS_LABELS.coachesMetric, value: stats.coaches },
    { label: ADMIN_USERS_LABELS.disabledUsersMetric, value: stats.disabled },
  ];

  return (
    <section className={styles.overview} aria-label={ADMIN_USERS_LABELS.overviewLabel}>
      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <dt className={styles.label}>{metric.label}</dt>
            <dd className={styles.value}>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
