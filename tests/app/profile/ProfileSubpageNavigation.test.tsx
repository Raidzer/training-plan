import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompetitionsHeader } from "@/app/(protected)/profile/competitions/CompetitionsClient/components/CompetitionsHeader/CompetitionsHeader";
import { competitionsLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import { RecordsHeader } from "@/app/(protected)/profile/records/RecordsClient/components/RecordsHeader/RecordsHeader";
import { RECORDS_LABELS } from "@/app/(protected)/profile/records/RecordsClient/constants/recordsConstants";
import { ShoesHeader } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoesHeader/ShoesHeader";
import { shoesLabels } from "@/app/(protected)/profile/shoes/ShoesClient/constants/shoesConstants";

const PROFILE_SUBPAGES = [
  {
    name: "обувь",
    Header: ShoesHeader,
    backButtonLabel: shoesLabels.backButton,
  },
  {
    name: "личные рекорды",
    Header: RecordsHeader,
    backButtonLabel: RECORDS_LABELS.backButton,
  },
  {
    name: "соревнования",
    Header: CompetitionsHeader,
    backButtonLabel: competitionsLabels.backButton,
  },
] as const;

describe.each(PROFILE_SUBPAGES)("Навигация страницы «$name»", ({ Header, backButtonLabel }) => {
  it("возвращает пользователя в главное меню", () => {
    render(<Header />);

    const backLink = screen.getByRole("link", { name: backButtonLabel });

    expect(backButtonLabel).toBe("Назад в главное меню");
    expect(backLink.getAttribute("href")).toBe("/dashboard");
  });
});
