import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResultsError from "@/app/results/error";
import ResultsLoading from "@/app/results/loading";

describe("Results route states", () => {
  it("announces the loading state", () => {
    render(<ResultsLoading />);

    expect(screen.getByRole("heading", { name: "Загружаем результаты клуба" }).tagName).toBe("H1");
    expect(
      screen
        .getByRole("heading", { name: "Загружаем результаты клуба" })
        .parentElement?.getAttribute("aria-busy")
    ).toBe("true");
  });

  it("lets the user retry after a loading error", () => {
    const reset = vi.fn();

    render(<ResultsError error={new Error("network failure")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
