import type { Session } from "next-auth";

export type DashboardClientProps = {
  session: Session;
};

export type DashboardCardId =
  | "users"
  | "invites"
  | "templates"
  | "plan"
  | "diary"
  | "shoes"
  | "records"
  | "competitions";

export type DashboardCardConfig = {
  id: DashboardCardId;
  title: string;
  description: string;
  href: string;
  adminOnly?: boolean;
};

export type DashboardSectionId = "club-management" | "training" | "sports-profile";

export type DashboardSectionConfig = {
  id: DashboardSectionId;
  label: string;
  description: string;
  cards: readonly DashboardCardConfig[];
  adminOnly?: boolean;
};
