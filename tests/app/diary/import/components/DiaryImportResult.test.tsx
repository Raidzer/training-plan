import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DiaryImportResult } from "@/app/(protected)/diary/import/DiaryImportClient/components/DiaryImportResult/DiaryImportResult";

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

describe("DiaryImportResult", () => {
  it("показывает все показатели успешного импорта и переходы", () => {
    render(
      <DiaryImportResult
        result={{
          sheetName: "Дневник(2026)",
          parsedRows: 12,
          matchedRows: 10,
          reportsUpserted: 8,
          reportsSkipped: 2,
          weightEntriesUpserted: 6,
          recoveryEntriesUpserted: 4,
          skippedRows: 2,
          errors: [],
          warnings: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Дневник импортирован" })).toBeTruthy();
    expect(screen.getByText("Прочитано строк")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Привязано")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("Отчётов сохранено")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
    expect(screen.getByText("Строк пропущено")).toBeTruthy();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("Записи веса")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getByText("Дни восстановления")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("Дневник(2026)")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Открыть дневник за период" }).getAttribute("href")
    ).toBe("/diary/period");
    expect(screen.getByRole("link", { name: "Открыть план" }).getAttribute("href")).toBe("/plan");
  });

  it("показывает частичный импорт, ошибки и предупреждения", () => {
    render(
      <DiaryImportResult
        result={{
          sheetName: "Дневник",
          parsedRows: 4,
          matchedRows: 2,
          reportsUpserted: 2,
          reportsSkipped: 1,
          weightEntriesUpserted: 0,
          recoveryEntriesUpserted: 0,
          skippedRows: 2,
          errors: [{ row: 4, message: "Некорректная дата" }],
          warnings: [{ row: 7, message: "Тренировка не найдена в плане" }],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Импорт завершён с замечаниями" })).toBeTruthy();
    expect(screen.getByText("Строка 4: Некорректная дата")).toBeTruthy();
    expect(screen.getByText("Строка 7: Тренировка не найдена в плане")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Ошибки строк: 1" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Предупреждения: 1" })).toBeTruthy();
  });

  it("показывает постоянную серверную ошибку без переходов к результату", () => {
    render(<DiaryImportResult result={{ error: "Не найден лист дневника" }} />);

    expect(screen.getByRole("heading", { name: "Импорт не выполнен" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Не найден лист дневника");
    expect(screen.queryByText("Прочитано строк")).toBeNull();
    expect(screen.queryByRole("link", { name: "Открыть дневник за период" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Открыть план" })).toBeNull();
  });

  it("не выдаёт пустой лист за успешный импорт", () => {
    render(
      <DiaryImportResult
        result={{
          sheetName: "Дневник",
          parsedRows: 0,
          matchedRows: 0,
          reportsUpserted: 0,
          reportsSkipped: 0,
          weightEntriesUpserted: 0,
          recoveryEntriesUpserted: 0,
          skippedRows: 0,
          errors: [],
          warnings: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "В файле нет данных для импорта" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Дневник импортирован" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Открыть дневник за период" })).toBeNull();
  });

  it("делает длинный список ошибок доступным для прокрутки с клавиатуры", () => {
    const errors = Array.from({ length: 7 }, (_, index) => ({
      row: index + 2,
      message: `Ошибка ${index + 1}`,
    }));

    render(
      <DiaryImportResult
        result={{
          parsedRows: 7,
          matchedRows: 0,
          reportsUpserted: 0,
          reportsSkipped: 0,
          weightEntriesUpserted: 0,
          recoveryEntriesUpserted: 0,
          skippedRows: 7,
          errors,
        }}
      />
    );

    expect(screen.getByRole("list", { name: "Ошибки строк: 7" }).getAttribute("tabindex")).toBe(
      "0"
    );
  });
});
