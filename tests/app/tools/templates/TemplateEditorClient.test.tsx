import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "antd";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplateEditorClient } from "@/app/(protected)/tools/templates/TemplateEditorClient/TemplateEditorClient";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";

const templateEditorMocks = vi.hoisted(() => ({
  createTemplateMock: vi.fn(),
  updateTemplateMock: vi.fn(),
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock("@/app/actions/diaryTemplates", () => ({
  createTemplate: templateEditorMocks.createTemplateMock,
  updateTemplate: templateEditorMocks.updateTemplateMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: templateEditorMocks.routerPushMock,
    replace: templateEditorMocks.routerReplaceMock,
  }),
}));

function createTemplate(overrides: Partial<DiaryResultTemplate> = {}): DiaryResultTemplate {
  return {
    id: 7,
    userId: 20,
    name: "Темповая работа",
    type: "workout",
    level: "user",
    code: "TEMPO",
    matchPattern: "темп; бег",
    outputTemplate: "{{time}}",
    schema: [
      {
        key: "time",
        label: "Время",
        type: "time",
        weight: 5,
        defaultValue: "20:00",
      },
    ],
    calculations: [{ name: "pace", expression: "time / 5" }],
    sortOrder: 12,
    isInline: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

function renderWithApp(ui: ReactNode) {
  return render(<App>{ui}</App>);
}

function fillRequiredTemplateFields() {
  fireEvent.change(screen.getByLabelText("Название шаблона"), {
    target: { value: "  Интервальная работа  " },
  });
  fireEvent.change(screen.getByLabelText("Системный код"), {
    target: { value: "intervals_5k" },
  });
  fireEvent.change(screen.getByLabelText("Текст отчёта"), {
    target: { value: "  {{result}}  " },
  });
}

describe("TemplateEditorClient", () => {
  beforeEach(() => {
    templateEditorMocks.createTemplateMock.mockResolvedValue(42);
    templateEditorMocks.updateTemplateMock.mockResolvedValue(undefined);
  });

  it("создаёт шаблон с добавленным полем и переходит на его страницу", async () => {
    renderWithApp(<TemplateEditorClient template={null} userId={20} />);

    expect(screen.getByRole("heading", { level: 1, name: "Новый шаблон" })).toBeTruthy();
    expect(screen.getByText("Поля ещё не добавлены")).toBeTruthy();

    fillRequiredTemplateFields();
    fireEvent.click(screen.getByRole("button", { name: "Добавить поле" }));
    fireEvent.change(screen.getByLabelText("Код поля"), {
      target: { value: "result" },
    });
    fireEvent.change(screen.getByLabelText("Название"), {
      target: { value: "Результат" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить шаблон" }));

    await waitFor(() => {
      expect(templateEditorMocks.createTemplateMock).toHaveBeenCalledWith({
        userId: 20,
        name: "Интервальная работа",
        code: "INTERVALS_5K",
        matchPattern: null,
        schema: [
          expect.objectContaining({
            key: "result",
            label: "Результат",
            type: "text",
          }),
        ],
        outputTemplate: "  {{result}}  ",
        isInline: false,
        calculations: [],
        sortOrder: 0,
        type: "common",
        level: "general",
      });
    });

    expect(templateEditorMocks.routerReplaceMock).toHaveBeenCalledWith("/tools/templates/42");
    expect(screen.getAllByText("Шаблон сохранён").length).toBeGreaterThan(0);
  });

  it("обновляет шаблон без потери скрытой метаинформации", async () => {
    const template = createTemplate();
    renderWithApp(<TemplateEditorClient template={template} userId={20} />);

    expect(screen.getByRole("heading", { level: 1, name: "Темповая работа" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Название шаблона"), {
      target: { value: "Темповая работа 2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить шаблон" }));

    await waitFor(() => {
      expect(templateEditorMocks.updateTemplateMock).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          userId: 20,
          name: "Темповая работа 2",
          type: "workout",
          level: "user",
          calculations: [{ name: "pace", expression: "time / 5" }],
          sortOrder: 12,
          schema: [
            {
              key: "time",
              label: "Время",
              type: "time",
              weight: 5,
              defaultValue: "20:00",
            },
          ],
        })
      );
    });

    expect(templateEditorMocks.routerReplaceMock).not.toHaveBeenCalled();
    expect(templateEditorMocks.routerPushMock).not.toHaveBeenCalled();
  });

  it("показывает ошибку сохранения и оставляет редактор в изменённом состоянии", async () => {
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
    templateEditorMocks.createTemplateMock.mockRejectedValueOnce(new Error("save-failed"));
    renderWithApp(<TemplateEditorClient template={null} userId={20} />);

    fillRequiredTemplateFields();
    fireEvent.click(screen.getByRole("button", { name: "Сохранить шаблон" }));

    expect(
      await screen.findByText("Не удалось сохранить шаблон. Проверьте данные и попробуйте снова.")
    ).toBeTruthy();
    expect(screen.getAllByText("Не удалось сохранить").length).toBeGreaterThan(0);
    expect(templateEditorMocks.routerReplaceMock).not.toHaveBeenCalled();
    expect(consoleErrorMock).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorMock.mockRestore();
  });

  it("запрашивает подтверждение при выходе с несохранёнными изменениями", () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWithApp(<TemplateEditorClient template={null} userId={20} />);

    fireEvent.change(screen.getByLabelText("Название шаблона"), {
      target: { value: "Незавершённый шаблон" },
    });
    fireEvent.click(screen.getByRole("button", { name: "К шаблонам" }));

    expect(confirmMock).toHaveBeenCalledWith(
      "В шаблоне есть несохранённые изменения. Покинуть редактор?"
    );
    expect(templateEditorMocks.routerPushMock).not.toHaveBeenCalled();

    confirmMock.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(templateEditorMocks.routerPushMock).toHaveBeenCalledWith("/tools/templates");

    confirmMock.mockRestore();
  });

  it("показывает настройки списка только для поля соответствующего типа", () => {
    const listEditor = renderWithApp(
      <TemplateEditorClient
        template={createTemplate({
          schema: [
            {
              key: "laps",
              label: "Отрезки",
              type: "list",
              itemType: "time",
              listSize: 5,
            },
          ],
        })}
        userId={20}
      />
    );

    const fieldCard = screen.getByRole("article", { name: "Поле 1" });
    expect(within(fieldCard).getByLabelText("Тип элементов")).toBeTruthy();
    expect(within(fieldCard).getByLabelText<HTMLInputElement>("Количество элементов").value).toBe(
      "5"
    );

    listEditor.unmount();
    renderWithApp(<TemplateEditorClient template={createTemplate()} userId={20} />);

    const textFieldCard = screen.getByRole("article", { name: "Поле 1" });
    expect(within(textFieldCard).queryByLabelText("Тип элементов")).toBeNull();
    expect(within(textFieldCard).queryByLabelText("Количество элементов")).toBeNull();
  });

  it("не сохраняет форму с повторяющимися кодами полей", async () => {
    renderWithApp(<TemplateEditorClient template={null} userId={20} />);
    fillRequiredTemplateFields();

    fireEvent.click(screen.getByRole("button", { name: "Добавить поле" }));
    fireEvent.click(screen.getByRole("button", { name: "Добавить поле" }));

    const fieldCodeInputs = screen.getAllByLabelText("Код поля");
    const fieldNameInputs = screen.getAllByLabelText("Название");
    fireEvent.change(fieldCodeInputs[0], { target: { value: "time" } });
    fireEvent.change(fieldCodeInputs[1], { target: { value: "TIME" } });
    fireEvent.change(fieldNameInputs[0], { target: { value: "Первое время" } });
    fireEvent.change(fieldNameInputs[1], { target: { value: "Второе время" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить шаблон" }));

    await waitFor(() => {
      expect(screen.getAllByText("Коды полей не должны повторяться.")).toHaveLength(2);
    });
    expect(templateEditorMocks.createTemplateMock).not.toHaveBeenCalled();
  });
});
