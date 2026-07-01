import type { CompetitionPriority } from "@/shared/constants/competitions";

export type AdminCompetitionItem = {
  id: number;
  date: string;
  nameLocation: string;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string | null;
};

export type AdminCompetitionBlockItem = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  competitions: AdminCompetitionItem[];
};

export type AdminUserCompetitionsContentProps = {
  userLabel: string;
  blocks: AdminCompetitionBlockItem[];
};
