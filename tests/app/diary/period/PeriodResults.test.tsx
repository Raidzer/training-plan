import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeriodResults } from "@/app/(protected)/diary/period/DiaryPeriodClient/components/PeriodResults/PeriodResults";
import type { DayStatus } from "@/app/(protected)/diary/period/DiaryPeriodClient/types/periodTypes";

const day: DayStatus = {
  date: "2026-06-01",
  hasWeightMorning: true,
  hasWeightEvening: true,
  hasBath: false,
  hasMfr: false,
  hasMassage: false,
  hasSleep: true,
  workoutsTotal: 1,
  workoutsWithFullReport: 1,
  dayHasReport: true,
  totalDistanceKm: 10,
};

describe("PeriodResults", () => {
  it("показывает доступное состояние загрузки", () => {
    render(<PeriodResults days={[]} loading={true} error={null} onRetry={vi.fn()} />);

    expect(screen.getByRole("status").textContent).toContain(
      "Загружаем данные за выбранный период."
    );
    expect(screen.getByLabelText("Загружаем данные за выбранный период.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("показывает ошибку и повторяет загрузку", () => {
    const onRetry = vi.fn();
    render(
      <PeriodResults
        days={[]}
        loading={false}
        error="Сервис временно недоступен."
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain("Не удалось загрузить период");
    expect(screen.getByRole("alert").textContent).toContain("Сервис временно недоступен.");
    fireEvent.click(screen.getByRole("button", { name: /Повторить/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("показывает пустое состояние", () => {
    render(<PeriodResults days={[]} loading={false} error={null} onRetry={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "За этот период нет данных" })
    ).toBeTruthy();
    expect(screen.getByText("Измените диапазон дат и повторите поиск.")).toBeTruthy();
    expect(screen.getByLabelText("0 дн.")).toBeTruthy();
  });

  it("рендерит desktop и mobile представления результатов", () => {
    render(<PeriodResults days={[day]} loading={false} error={null} onRetry={vi.fn()} />);

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("article")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Открыть отчёт: 01.06.2026" })).toHaveLength(2);
    expect(screen.getByLabelText("1 дн.")).toBeTruthy();
  });
});
