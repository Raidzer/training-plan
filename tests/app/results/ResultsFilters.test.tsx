import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsFilters } from "@/app/results/ResultsClient/components/ResultsFilters/ResultsFilters";

describe("ResultsFilters", () => {
  it("показывает активные фильтры и отправляет выбранные значения", () => {
    const onDistanceChange = vi.fn();
    const onGenderChange = vi.fn();

    render(
      <ResultsFilters
        activeDistance="10k"
        activeGender="male"
        onDistanceChange={onDistanceChange}
        onGenderChange={onGenderChange}
      />
    );

    const distanceGroup = screen.getByRole("group", { name: "Выбор дистанции" });
    const genderGroup = screen.getByRole("group", { name: "Фильтр по полу" });

    expect(
      within(distanceGroup).getByRole("button", { name: "10 км" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      within(genderGroup).getByRole("button", { name: "Мужчины" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      within(distanceGroup).getByRole("button", { name: "10 км" }).getAttribute("aria-controls")
    ).toBe("results-panel");

    fireEvent.click(within(distanceGroup).getByRole("button", { name: "5 км" }));
    fireEvent.click(within(distanceGroup).getByRole("button", { name: "10 км" }));
    fireEvent.click(within(distanceGroup).getByRole("button", { name: "21 км" }));
    fireEvent.click(within(distanceGroup).getByRole("button", { name: "42 км" }));
    fireEvent.click(within(genderGroup).getByRole("button", { name: "Все" }));
    fireEvent.click(within(genderGroup).getByRole("button", { name: "Мужчины" }));
    fireEvent.click(within(genderGroup).getByRole("button", { name: "Женщины" }));

    expect(onDistanceChange.mock.calls.map(([value]) => value)).toEqual([
      "5k",
      "10k",
      "21k",
      "42k",
    ]);
    expect(onGenderChange.mock.calls.map(([value]) => value)).toEqual(["all", "male", "female"]);
  });
});
