import type { ReactNode } from "react";
import styles from "./PublicPageHero.module.scss";

export type PublicPageStat = {
  label: string;
  value: ReactNode;
};

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  stats?: readonly PublicPageStat[];
  actions?: ReactNode;
};

export function PublicPageHero({
  eyebrow,
  title,
  description,
  titleId,
  stats = [],
  actions,
}: PublicPageHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title} id={titleId}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      {stats.length > 0 ? (
        <dl className={styles.stats} aria-label="Краткая сводка">
          {stats.map((stat) => (
            <div className={styles.stat} key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
