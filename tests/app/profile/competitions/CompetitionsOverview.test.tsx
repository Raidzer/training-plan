import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompetitionsOverview } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionsOverview/CompetitionsOverview";
import { competitionsLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import type {
  CompetitionBlockItem,
  CompetitionItem,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

function createCompetition(id: number, priority: CompetitionItem["priority"]): CompetitionItem {
  return {
    id,
    blockId: 1,
    date: "2026-05-10",
    nameLocation: "Москва",
    distanceMeters: 10000,
    distanceLabel: "10 км",
    priority,
    result: null,
    sortOrder: id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function createBlock(id: number, competitions: CompetitionItem[]): CompetitionBlockItem {
  return {
    id,
    title: "Блок " + id,
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    sortOrder: id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    competitions: competitions.map((competition) => ({
      ...competition,
      blockId: id,
    })),
  };
}

describe("CompetitionsOverview", () => {
  it("должен считать блоки, все старты и главные старты", () => {
    const blocks = [
      createBlock(1, [
        createCompetition(1, COMPETITION_PRIORITIES.MAIN),
        createCompetition(2, COMPETITION_PRIORITIES.REGULAR),
      ]),
      createBlock(2, [createCompetition(3, COMPETITION_PRIORITIES.MAIN)]),
    ];

    render(<CompetitionsOverview blocks={blocks} loading={false} loadError={false} />);

    const overview = screen.getByRole("region", {
      name: competitionsLabels.overviewLabel,
    });
    const totalBlocks = within(overview).getByText(
      competitionsLabels.totalBlocksLabel
    ).parentElement;
    const totalCompetitions = within(overview).getByText(
      competitionsLabels.totalCompetitionsLabel
    ).parentElement;
    const mainCompetitions = within(overview).getByText(
      competitionsLabels.mainCompetitionsLabel
    ).parentElement;

    expect(totalBlocks?.textContent).toContain("2");
    expect(totalCompetitions?.textContent).toContain("3");
    expect(mainCompetitions?.textContent).toContain("2");
  });

  it("не должен показывать ложные нули во время загрузки", () => {
    render(<CompetitionsOverview blocks={[]} loading loadError={false} />);

    const overview = screen.getByRole("region", {
      name: competitionsLabels.overviewLabel,
    });

    expect(overview.getAttribute("aria-busy")).toBe("true");
    expect(within(overview).getAllByText(competitionsLabels.overviewLoading)).toHaveLength(3);
  });
});
