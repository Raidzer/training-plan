"use client";

import { Card } from "antd";
import { DashboardCards } from "./components/DashboardCards/DashboardCards";
import { DashboardHeader } from "./components/DashboardHeader/DashboardHeader";
import type { DashboardClientProps } from "./types/dashboardTypes";
import styles from "./DashboardClient.module.scss";

export function DashboardClient({ session }: DashboardClientProps) {
  const isAdmin = session.user?.role === "admin";

  return (
    <div className={styles.wrapper}>
      <Card className={styles.panel}>
        <DashboardHeader userName={session.user?.name} userEmail={session.user?.email} />
        <DashboardCards isAdmin={isAdmin} />
      </Card>
    </div>
  );
}
