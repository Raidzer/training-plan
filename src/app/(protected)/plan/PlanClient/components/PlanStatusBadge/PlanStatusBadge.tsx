import styles from "./PlanStatusBadge.module.scss";

type PlanStatusBadgeProps = {
  label?: string;
  value: string;
  emphasized?: boolean;
};

export function PlanStatusBadge({ label, value, emphasized = false }: PlanStatusBadgeProps) {
  const className = [styles.badge, emphasized ? styles.emphasized : ""].filter(Boolean).join(" ");

  return (
    <span className={className}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <strong className={styles.value}>{value}</strong>
    </span>
  );
}
