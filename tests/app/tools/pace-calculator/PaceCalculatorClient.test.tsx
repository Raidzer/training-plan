import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import PaceCalculatorPage, { metadata } from "@/app/tools/pace-calculator/page";
import { PaceCalculatorClient } from "@/app/tools/pace-calculator/PaceCalculatorClient/PaceCalculatorClient";

describe("PaceCalculatorClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("показывает доступные поля, пресеты и раскладку", () => {
    render(<PaceCalculatorClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Темп, результат и раскладка" })
    ).toBeTruthy();
    const distanceInput = screen.getByLabelText("Дистанция в метрах");

    expect(distanceInput.getAttribute("value")).toBe("10000");
    expect(screen.getByLabelText("Итоговое время").getAttribute("value")).toBe("00:37:30");
    expect(screen.getByLabelText("Темп на километр").getAttribute("value")).toBe("00:03:45");
    expect(screen.getByRole("button", { name: "10 000 м" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByRole("list", { name: "Накопленное время по отметкам" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Популярные дистанции" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Очистить дистанцию" }));

    expect(document.activeElement).toBe(distanceInput);
  });

  it("обновляет расчёт без отправки формы и сохраняет результат", async () => {
    render(<PaceCalculatorClient showIntro={false} />);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "5 000 м" }));
    fireEvent.change(screen.getByLabelText("Темп на километр"), {
      target: { value: "00:04:00" },
    });

    expect(screen.getByLabelText("Итоговое время").getAttribute("value")).toBe("00:20:00");

    fireEvent.click(screen.getByRole("button", { name: "Сохранить результат" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Сохранено расчётов: 1")).toBeTruthy();
    });

    const savedHeading = screen.getByRole("heading", {
      level: 2,
      name: "Сохранённые расчёты",
    });
    const savedSection = savedHeading.closest("section");

    expect(savedSection).toBeTruthy();
    expect(within(savedSection as HTMLElement).getByText(/5\s000 м/)).toBeTruthy();

    fireEvent.click(within(savedSection as HTMLElement).getByRole("button", { name: /Удалить:/ }));

    await waitFor(() => {
      expect(document.activeElement).toBe(savedHeading);
    });
  });

  it("оборачивается публичным shell и задаёт метаинформацию", () => {
    render(<PaceCalculatorPage />);

    expect(metadata.title).toBe("Калькулятор темпа и результата | СПИРОС");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("navigation", { name: "Переключение беговых инструментов" })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Темп и раскладка/ }).getAttribute("aria-current")
    ).toBe("page");
  });

  it("различает кнопки удаления одинаковых сохранённых расчётов", async () => {
    render(<PaceCalculatorClient />);

    const saveButton = screen.getByRole("button", { name: "Сохранить результат" });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Сохранено расчётов: 2")).toBeTruthy();
    });

    const deleteLabels = screen
      .getAllByRole("button", { name: /Удалить:/ })
      .map((button) => button.getAttribute("aria-label"));

    expect(deleteLabels).toHaveLength(2);
    expect(new Set(deleteLabels).size).toBe(2);
  });
});
