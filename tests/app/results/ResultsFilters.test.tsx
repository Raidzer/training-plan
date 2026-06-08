import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("tab", { name: "10 км" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Мужчины" }).getAttribute("aria-pressed")).toBe(
      "true"
    );

    fireEvent.click(screen.getByRole("tab", { name: "5 км" }));
    fireEvent.click(screen.getByRole("tab", { name: "10 км" }));
    fireEvent.click(screen.getByRole("tab", { name: "21 км" }));
    fireEvent.click(screen.getByRole("tab", { name: "42 км" }));
    fireEvent.click(screen.getByRole("button", { name: "Все" }));
    fireEvent.click(screen.getByRole("button", { name: "Мужчины" }));
    fireEvent.click(screen.getByRole("button", { name: "Женщины" }));

    expect(onDistanceChange.mock.calls.map(([value]) => value)).toEqual([
      "5k",
      "10k",
      "21k",
      "42k",
    ]);
    expect(onGenderChange.mock.calls.map(([value]) => value)).toEqual(["all", "male", "female"]);
  });
});
