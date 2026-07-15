import { DASHBOARD_SECTIONS } from "../../constants/dashboardConstants";
import { DashboardSection } from "../DashboardSection/DashboardSection";
import styles from "./DashboardSections.module.scss";

type DashboardSectionsProps = {
  isAdmin: boolean;
};

export function DashboardSections({ isAdmin }: DashboardSectionsProps) {
  const visibleSections = DASHBOARD_SECTIONS.filter((section) => !section.adminOnly || isAdmin);

  return (
    <div className={styles.sections}>
      {visibleSections.map((section) => (
        <DashboardSection section={section} isAdmin={isAdmin} key={section.id} />
      ))}
    </div>
  );
}
