import { ADMIN_INVITES_LABELS } from "../../constants/adminInvitesConstants";
import type { AdminInvitesStats } from "../../types/adminInvitesTypes";
import styles from "./AdminInvitesOverview.module.scss";

type AdminInvitesOverviewProps = {
  stats: AdminInvitesStats;
};

export function AdminInvitesOverview({ stats }: AdminInvitesOverviewProps) {
  const metrics = [
    { label: ADMIN_INVITES_LABELS.totalInvitesMetric, value: stats.total },
    { label: ADMIN_INVITES_LABELS.activeInvitesMetric, value: stats.active },
    { label: ADMIN_INVITES_LABELS.usedInvitesMetric, value: stats.used },
    { label: ADMIN_INVITES_LABELS.expiredInvitesMetric, value: stats.expired },
  ];

  return (
    <section className={styles.overview} aria-label={ADMIN_INVITES_LABELS.overviewLabel}>
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
