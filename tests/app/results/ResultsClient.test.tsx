import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultsClient } from "@/app/results/ResultsClient/ResultsClient";
import type { ResultsEntry } from "@/app/results/ResultsClient/types/resultsTypes";

function createResult(overrides: Partial<ResultsEntry>): ResultsEntry {
  return {
    id: 1,
    distanceKey: "5k",
    athlete: "Иван Петров",
    gender: "male",
    timeText: "00:18:00",
    timeSeconds: 1080,
    recordDate: "2026-05-10",
    raceName: "Весенний старт",
    raceCity: "Москва",
    protocolUrl: null,
    ...overrides,
  };
}

describe("ResultsClient", () => {
  it("renders hero summary, records and responsive ranking semantics", () => {
    const { container } = render(
      <ResultsClient
        results={[
          createResult({
            id: 1,
            protocolUrl: "https://example.com/protocol",
          }),
          createResult({
            id: 2,
            athlete: "Анна Смирнова",
            gender: "female",
            timeText: "00:19:30",
            timeSeconds: 1170,
          }),
          createResult({
            id: 3,
            athlete: "Мария Орлова",
            distanceKey: "10k",
            gender: "female",
            timeText: "00:42:00",
            timeSeconds: 2520,
          }),
        ]}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Результаты клуба" }).tagName).toBe("H1");
    expect(screen.getByText("Всего финишей").nextElementSibling?.textContent).toBe("3");
    expect(screen.getByText("Дистанции").nextElementSibling?.textContent).toBe("4");
    expect(screen.getByRole("heading", { level: 2, name: "Финиши на 5 км" }).tagName).toBe("H2");
    expect(screen.getByText("2 финиша").textContent).toBe("2 финиша");
    expect(screen.getByRole("heading", { level: 4, name: "Иван Петров" }).tagName).toBe("H4");
    expect(screen.getByLabelText("2 место").textContent).toBe("02");
    expect(container.querySelector("main")).toBeNull();

    const protocolLink = screen.getByRole("link", { name: /протокол/i });
    expect(protocolLink.getAttribute("target")).toBe("_blank");
    expect(protocolLink.getAttribute("rel")).toBe("noreferrer");
  });

  it("updates the result summary and shows guidance for an empty slice", () => {
    render(<ResultsClient results={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "21 км" }));

    expect(screen.getByRole("heading", { level: 2, name: "Финиши на 21 км" }).tagName).toBe("H2");
    expect(screen.getByText("0 финишей").textContent).toBe("0 финишей");
    expect(screen.getByText("На этом срезе пока нет финишей").textContent).toBe(
      "На этом срезе пока нет финишей"
    );
    expect(
      screen.getByText("Выберите другую дистанцию или измените фильтр по полу.").textContent
    ).toBe("Выберите другую дистанцию или измените фильтр по полу.");
  });

  it("различает ссылки на протоколы даже при одинаковом спортсмене и времени", () => {
    render(
      <ResultsClient
        results={[
          createResult({ id: 10, protocolUrl: "https://example.com/protocol-10" }),
          createResult({
            id: 11,
            gender: "female",
            protocolUrl: "https://example.com/protocol-11",
          }),
        ]}
      />
    );

    const protocolLabels = screen
      .getAllByRole("link", { name: /протокол/i })
      .map((link) => link.getAttribute("aria-label"));

    expect(protocolLabels).toHaveLength(2);
    expect(new Set(protocolLabels).size).toBe(2);
  });
});
