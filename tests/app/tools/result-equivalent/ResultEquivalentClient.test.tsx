import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResultEquivalentPage, { metadata } from "@/app/tools/result-equivalent/page";
import { ResultEquivalentClient } from "@/app/tools/result-equivalent/ResultEquivalentClient/ResultEquivalentClient";

describe("ResultEquivalentClient", () => {
  it("связывает подписи с полями и выводит семантическую таблицу", () => {
    render(<ResultEquivalentClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Прогноз результата на дистанции" })
    ).toBeTruthy();
    const distanceInput = screen.getByLabelText("Дистанция в метрах");

    expect(distanceInput.getAttribute("value")).toBe("5000");
    expect(screen.getByLabelText("Итоговое время").getAttribute("value")).toBe("00:20:00");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("исходная")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Прогноз" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Популярные исходные дистанции" })).toBeTruthy();
    expect(screen.getByRole("table").parentElement?.hasAttribute("aria-live")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Очистить исходную дистанцию" }));

    expect(document.activeElement).toBe(distanceInput);
  });

  it("переключает модель и обновляет видимый прогноз", () => {
    render(<ResultEquivalentClient showIntro={false} />);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cameron" }));

    const cameronButton = screen.getByRole("button", { name: "Cameron" });

    expect(cameronButton.getAttribute("aria-pressed")).toBe("true");
    expect(cameronButton.getAttribute("aria-describedby")).toBe("equivalent-method-description");
    expect(screen.getByText(/Регрессионная модель/)).toBeTruthy();
    expect(screen.getByText("00:41:40")).toBeTruthy();
  });

  it("оборачивается публичным shell и задаёт метаинформацию", () => {
    render(<ResultEquivalentPage />);

    expect(metadata.title).toBe("Прогноз результата на дистанции | СПИРОС");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: /Прогноз результата/ }).getAttribute("aria-current")
    ).toBe("page");
  });
});
