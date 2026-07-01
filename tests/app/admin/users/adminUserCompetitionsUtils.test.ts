import { describe, expect, it } from "vitest";
import type { CompetitionBlockWithCompetitions } from "@/server/competitions";
import {
  buildAdminUserCompetitionsUserLabel,
  formatAdminCompetitionBlockPeriod,
  mapCompetitionBlocksToAdminItems,
} from "@/app/(protected)/admin/users/[userId]/competitions/AdminUserCompetitionsPage/utils/adminUserCompetitionsUtils";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

function createServerBlock(
  overrides: Partial<CompetitionBlockWithCompetitions> = {}
): CompetitionBlockWithCompetitions {
  return {
    id: 10,
    title: "Весна",
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    sortOrder: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    competitions: [
      {
        id: 20,
        blockId: 10,
        date: "2026-05-10",
        nameLocation: "Москва",
        distanceMeters: 10000,
        distanceLabel: "10 км",
        priority: COMPETITION_PRIORITIES.REGULAR,
        result: "39:30",
        sortOrder: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

describe("adminUserCompetitionsUtils", () => {
  it("должен собирать подпись пользователя", () => {
    expect(
      buildAdminUserCompetitionsUserLabel(
        { name: "Иван", lastName: "Петров", email: "ivan@example.com" },
        7
      )
    ).toBe("Иван Петров");
    expect(buildAdminUserCompetitionsUserLabel(null, 7)).toBe("ID: 7");
  });

  it("должен маппить серверные блоки только в поля для отображения", () => {
    const [block] = mapCompetitionBlocksToAdminItems([createServerBlock()]);

    expect(block).toEqual({
      id: 10,
      title: "Весна",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      competitions: [
        {
          id: 20,
          date: "2026-05-10",
          nameLocation: "Москва",
          distanceLabel: "10 км",
          priority: COMPETITION_PRIORITIES.REGULAR,
          result: "39:30",
        },
      ],
    });
    expect(formatAdminCompetitionBlockPeriod(block)).toBe("01.03.2026 - 01.06.2026");
  });
});
