import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminUserCompetitionsContent } from "@/app/(protected)/admin/users/[userId]/competitions/AdminUserCompetitionsPage/AdminUserCompetitionsPage";
import { ADMIN_USER_COMPETITIONS_LABELS } from "@/app/(protected)/admin/users/[userId]/competitions/AdminUserCompetitionsPage/constants/adminUserCompetitionsConstants";
import type { AdminCompetitionBlockItem } from "@/app/(protected)/admin/users/[userId]/competitions/AdminUserCompetitionsPage/types/adminUserCompetitionsTypes";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

function createBlock(
  overrides: Partial<AdminCompetitionBlockItem> = {}
): AdminCompetitionBlockItem {
  return {
    id: 10,
    title: "Весенний блок",
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    competitions: [
      {
        id: 20,
        date: "2026-05-10",
        nameLocation: "Московский полумарафон",
        distanceLabel: "21.1 км",
        priority: COMPETITION_PRIORITIES.MAIN,
        result: null,
      },
    ],
    ...overrides,
  };
}

describe("AdminUserCompetitionsContent", () => {
  it("должен показывать блоки и соревнования пользователя без действий редактирования", () => {
    render(<AdminUserCompetitionsContent userLabel="Иван Петров" blocks={[createBlock()]} />);

    expect(
      screen.getByRole("heading", {
        name: `${ADMIN_USER_COMPETITIONS_LABELS.titlePrefix}: Иван Петров`,
      })
    ).toBeTruthy();
    expect(screen.getByText("Весенний блок")).toBeTruthy();
    expect(screen.getByText("01.03.2026 - 01.06.2026")).toBeTruthy();
    expect(screen.getByText("10.05.2026")).toBeTruthy();
    expect(screen.getByText("Московский полумарафон")).toBeTruthy();
    expect(screen.getByText("21.1 км")).toBeTruthy();
    expect(screen.getByText("Главное")).toBeTruthy();
    expect(screen.getByText(ADMIN_USER_COMPETITIONS_LABELS.emptyResult)).toBeTruthy();
    expect(screen.queryByLabelText("Редактировать соревнование")).toBeNull();
  });

  it("должен показывать пустое состояние без блоков", () => {
    render(<AdminUserCompetitionsContent userLabel="Иван Петров" blocks={[]} />);

    expect(screen.getByText(ADMIN_USER_COMPETITIONS_LABELS.emptyBlocks)).toBeTruthy();
  });
});
