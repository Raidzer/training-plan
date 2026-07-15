import { ROLES } from "@/shared/constants";
import { DashboardHeader } from "./components/DashboardHeader/DashboardHeader";
import { DashboardSections } from "./components/DashboardSections/DashboardSections";
import type { DashboardClientProps } from "./types/dashboardTypes";
import styles from "./DashboardClient.module.scss";

export function DashboardClient({ session }: DashboardClientProps) {
  const isAdmin = session.user?.role === ROLES.ADMIN;

  return (
    <div className={styles.wrapper}>
      <DashboardHeader userName={session.user?.name} />
      <DashboardSections isAdmin={isAdmin} />
    </div>
  );
}
