import type { CompetitionBlockWithCompetitions } from "@/server/competitions";
import { formatCompetitionDate } from "@/shared/utils/competitionUtils";
import type { AdminCompetitionBlockItem } from "../types/adminUserCompetitionsTypes";

type AdminUserForCompetitions = {
  name: string;
  lastName: string | null;
  email: string;
} | null;

export const buildAdminUserCompetitionsUserLabel = (
  user: AdminUserForCompetitions,
  fallbackId: number
) => {
  if (!user) {
    return `ID: ${fallbackId}`;
  }

  const fullName = `${user.name} ${user.lastName || ""}`.trim();
  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email;
  }

  return `ID: ${fallbackId}`;
};

export const mapCompetitionBlocksToAdminItems = (
  blocks: CompetitionBlockWithCompetitions[]
): AdminCompetitionBlockItem[] =>
  blocks.map((block) => ({
    id: block.id,
    title: block.title,
    startDate: block.startDate,
    endDate: block.endDate,
    competitions: block.competitions.map((competition) => ({
      id: competition.id,
      date: competition.date,
      nameLocation: competition.nameLocation,
      distanceLabel: competition.distanceLabel,
      priority: competition.priority,
      result: competition.result,
    })),
  }));

export const formatAdminCompetitionBlockPeriod = (block: AdminCompetitionBlockItem) =>
  `${formatCompetitionDate(block.startDate)} - ${formatCompetitionDate(block.endDate)}`;
