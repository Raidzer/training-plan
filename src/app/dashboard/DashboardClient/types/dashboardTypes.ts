import type { Session } from "next-auth";

export type DashboardClientProps = {
  session: Session;
};

export type DashboardCardId = "admin" | "templates" | "plan" | "diary" | "shoes" | "records";

export type DashboardCardConfig = {
  id: DashboardCardId;
  title: string;
  description: string;
  href: string;
  adminOnly?: boolean;
};
