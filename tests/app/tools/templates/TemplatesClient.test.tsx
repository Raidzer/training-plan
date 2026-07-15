import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplatesClient } from "@/app/(protected)/tools/templates/TemplatesClient/TemplatesClient";
import type { TemplateSummary } from "@/app/(protected)/tools/templates/TemplatesClient/types/templatesTypes";

const templateMocks = vi.hoisted(() => ({
  deleteTemplateMock: vi.fn(),
}));

vi.mock("@/app/actions/diaryTemplates", () => ({
  deleteTemplate: templateMocks.deleteTemplateMock,
}));

function createTemplate(overrides: Partial<TemplateSummary> = {}): TemplateSummary {
  return {
    id: 1,
    userId: 20,
    name: "Темповая работа",
    matchPattern: "темп; бег",
    ...overrides,
  };
}

function renderTemplates(initialTemplates: TemplateSummary[]) {
  return render(<TemplatesClient initialTemplates={initialTemplates} />);
}

describe("TemplatesClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templateMocks.deleteTemplateMock.mockResolvedValue(undefined);
  });

  it("показывает header, сводку и семантические ссылки", () => {
    renderTemplates([
      createTemplate(),
      createTemplate({ id: 2, userId: null, name: "Системный шаблон" }),
    ]);

    expect(screen.getByRole("heading", { level: 1, name: "Шаблоны отчётов" })).toBeTruthy();
    expect(screen.getByText("Управление клубом")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Назад в главное меню" })).toHaveProperty(
      "pathname",
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: "Создать шаблон" })).toHaveProperty(
      "pathname",
      "/tools/templates/new"
    );

    const overview = screen.getByRole("region", { name: "Сводка по шаблонам отчётов" });
    expect(within(overview).getByText("2")).toBeTruthy();
    expect(within(overview).getAllByText("1")).toHaveLength(2);

    expect(
      screen.getByRole("link", { name: "Редактировать шаблон «Системный шаблон»" })
    ).toHaveProperty("pathname", "/tools/templates/2");
    expect(screen.queryByRole("button", { name: "Удалить шаблон «Системный шаблон»" })).toBeNull();
    expect(screen.getByText("Системный шаблон нельзя удалить")).toBeTruthy();
  });

  it("ищет, фильтрует и показывает состояние без результатов", () => {
    renderTemplates([
      createTemplate(),
      createTemplate({
        id: 2,
        userId: null,
        name: "Системный шаблон",
        matchPattern: "пульс",
      }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Системные" }));
    expect(screen.getByText("Системный шаблон")).toBeTruthy();
    expect(screen.queryByText("Темповая работа")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Все" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по шаблонам" }), {
      target: { value: "бег" },
    });
    expect(screen.getByText("Темповая работа")).toBeTruthy();
    expect(screen.queryByText("Системный шаблон")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по шаблонам" }), {
      target: { value: "неизвестный шаблон" },
    });
    expect(screen.getByRole("heading", { level: 3, name: "Ничего не найдено" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Сбросить поиск и фильтры" }));
    expect(screen.getByText("Темповая работа")).toBeTruthy();
    expect(screen.getByText("Системный шаблон")).toBeTruthy();
  });

  it("показывает настоящее пустое состояние", () => {
    renderTemplates([]);

    expect(screen.getByRole("heading", { level: 3, name: "Шаблонов пока нет" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Создать шаблон" })).toHaveLength(2);
  });

  it("удаляет пользовательский шаблон локально и обновляет сводку", async () => {
    renderTemplates([
      createTemplate(),
      createTemplate({ id: 2, userId: null, name: "Системный шаблон" }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Удалить шаблон «Темповая работа»" }));
    fireEvent.click(await screen.findByRole("button", { name: "Удалить" }));

    await waitFor(() => {
      expect(templateMocks.deleteTemplateMock).toHaveBeenCalledWith(1);
      expect(screen.queryByText("Темповая работа")).toBeNull();
    });

    expect(screen.getByText("Шаблон «Темповая работа» удалён.")).toBeTruthy();
    expect(screen.getByText("Системный шаблон")).toBeTruthy();

    const overview = screen.getByRole("region", { name: "Сводка по шаблонам отчётов" });
    expect(within(overview).getAllByText("1")).toHaveLength(2);
    expect(within(overview).getByText("0")).toBeTruthy();
  });

  it("сохраняет карточку и показывает ошибку удаления", async () => {
    templateMocks.deleteTemplateMock.mockRejectedValueOnce(new Error("delete-failed"));
    renderTemplates([createTemplate()]);

    fireEvent.click(screen.getByRole("button", { name: "Удалить шаблон «Темповая работа»" }));
    fireEvent.click(await screen.findByRole("button", { name: "Удалить" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Не удалось удалить шаблон «Темповая работа». Проверьте соединение и попробуйте снова."
    );
    expect(screen.getByText("Темповая работа")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Закрыть сообщение об ошибке" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
