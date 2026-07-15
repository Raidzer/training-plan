import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShoesOverview } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoesOverview/ShoesOverview";
import type { ShoeItem } from "@/app/(protected)/profile/shoes/ShoesClient/types/shoesTypes";

const shoe: ShoeItem = {
  id: 1,
  name: "Daily Trainer",
  mileageLimitKm: "800",
  currentMileageKm: "120",
  notifyOnLimitEmail: true,
  notifyOnLimitTelegram: false,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-02T00:00:00.000Z",
};

describe("ShoesOverview", () => {
  it("не показывает ложные нули при ошибке загрузки", () => {
    render(<ShoesOverview items={[]} loading={false} loadError />);

    const metrics = screen.getAllByRole("definition");
    expect(metrics).toHaveLength(3);
    expect(metrics.every((metric) => metric.textContent === "—Данные недоступны")).toBe(true);
  });

  it("показывает рассчитанную сводку после успешной загрузки", () => {
    render(<ShoesOverview items={[shoe]} loading={false} loadError={false} />);

    expect(screen.getAllByRole("definition").map((metric) => metric.textContent)).toEqual([
      "1",
      "1",
      "1",
    ]);
  });
});
