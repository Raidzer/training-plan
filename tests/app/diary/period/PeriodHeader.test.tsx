import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeriodHeader } from "@/app/(protected)/diary/period/DiaryPeriodClient/components/PeriodHeader/PeriodHeader";

describe("PeriodHeader", () => {
  it("рендерит заголовок и доступные ссылки навигации", () => {
    render(
      <PeriodHeader
        eyebrow="Дневник"
        title="Дневник за период"
        subtitle="Сводка за выбранные даты."
        dailyReportAction="Ежедневный отчёт"
        dashboardAction="Личный кабинет"
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Дневник за период" })).toBeTruthy();
    expect(screen.getByText("Сводка за выбранные даты.")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Действия страницы" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ежедневный отчёт" }).getAttribute("href")).toBe(
      "/diary"
    );
    expect(screen.getByRole("link", { name: "Личный кабинет" }).getAttribute("href")).toBe(
      "/dashboard"
    );
  });
});
