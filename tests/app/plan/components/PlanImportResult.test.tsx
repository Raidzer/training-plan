import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlanImportResult } from "@/app/(protected)/plan/PlanClient/components/PlanImportResult/PlanImportResult";

vi.mock("next/link", () => {
  return {
    default: ({
      children,
      className,
      href,
    }: {
      children: ReactNode;
      className?: string;
      href: string;
    }) => (
      <a className={className} href={href}>
        {children}
      </a>
    ),
  };
});

describe("PlanImportResult", () => {
  it("показывает статистику успешного импорта и переход к плану", () => {
    render(
      <PlanImportResult
        result={{
          importId: 17,
          inserted: 12,
          skipped: 2,
          totalRows: 14,
          sheetName: "Июнь",
          errors: [],
          warnings: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "План импортирован" })).toBeTruthy();
    expect(screen.getByText("Добавлено")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Пропущено")).toBeTruthy();
    expect(screen.getByText("#17")).toBeTruthy();
    expect(screen.getByText("Июнь")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Открыть план" }).getAttribute("href")).toBe("/plan");
  });

  it("показывает замечания и ошибки отдельных строк", () => {
    render(
      <PlanImportResult
        result={{
          importId: 18,
          inserted: 3,
          skipped: 2,
          errors: [{ row: 4, message: "Пустое задание" }],
          warnings: [{ row: 7, message: "Дата уже есть в плане" }],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Импорт завершён с замечаниями" })).toBeTruthy();
    expect(screen.getByText("Строка 4: Пустое задание")).toBeTruthy();
    expect(screen.getByText("Строка 7: Дата уже есть в плане")).toBeTruthy();
  });

  it("показывает серверную ошибку, детали и найденные заголовки", () => {
    render(
      <PlanImportResult
        result={{
          error: "Не найдены колонки Дата/Задание в первой строке.",
          details: ["Не найдена колонка: Дата."],
          foundHeaders: ["1: Тренировка", "2: Комментарий"],
          sheetName: "План",
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Импорт не выполнен" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Не найдены колонки");
    expect(screen.getByText("Не найдена колонка: Дата.")).toBeTruthy();
    expect(screen.getByText("1: Тренировка")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Открыть план" })).toBeNull();
  });

  it("делает длинный список ошибок доступным для прокрутки с клавиатуры", () => {
    const errors = Array.from({ length: 7 }, (_, index) => ({
      row: index + 2,
      message: `Ошибка ${index + 1}`,
    }));

    render(
      <PlanImportResult
        result={{
          importId: 19,
          inserted: 0,
          skipped: 7,
          errors,
        }}
      />
    );

    expect(screen.getByRole("list", { name: "Ошибки строк: 7" }).getAttribute("tabindex")).toBe(
      "0"
    );
  });
});
