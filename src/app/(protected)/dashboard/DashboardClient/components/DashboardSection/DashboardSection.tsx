import type { DashboardSectionConfig } from "../../types/dashboardTypes";
import { DashboardActionLink } from "../DashboardActionLink/DashboardActionLink";
import styles from "./DashboardSection.module.scss";

type DashboardSectionProps = {
  section: DashboardSectionConfig;
  isAdmin: boolean;
};

export function DashboardSection({ section, isAdmin }: DashboardSectionProps) {
  const visibleCards = section.cards.filter((card) => !card.adminOnly || isAdmin);

  if (visibleCards.length === 0) {
    return null;
  }

  const titleId = `dashboard-section-${section.id}`;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 className={styles.title} id={titleId}>
          {section.label}
        </h2>
      </header>
      <ul className={styles.list} role="list">
        {visibleCards.map((card) => (
          <li className={styles.item} key={card.id}>
            <DashboardActionLink card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
