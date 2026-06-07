import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "antd";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const templateMocks = vi.hoisted(() => ({
  deleteTemplateMock: vi.fn(),
  routerRefreshMock: vi.fn(),
}));

vi.mock("@/app/actions/diaryTemplates", () => ({
  deleteTemplate: templateMocks.deleteTemplateMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: templateMocks.routerRefreshMock,
  }),
}));

import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplateManager } from "@/components/templates/TemplateManager";

function renderWithApp(ui: ReactNode) {
  return render(<App>{ui}</App>);
}

function createTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    userId: 20,
    name: "Кросс",
    type: "workout",
    level: "user",
    code: "RUN",
    matchPattern: "кросс; бег",
    outputTemplate: "{{result}}",
    schema: [],
    calculations: [],
    sortOrder: 1,
    isInline: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("TemplateEditor and TemplateManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templateMocks.deleteTemplateMock.mockResolvedValue(undefined);
  });

  it("TemplateEditor должен добавлять поле и сохранять шаблон", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const { container } = renderWithApp(<TemplateEditor onSave={onSave} onCancel={onCancel} />);

    fireEvent.change(screen.getByPlaceholderText("Например: Интервалы"), {
      target: { value: "Темповая" },
    });
    fireEvent.change(screen.getByPlaceholderText("PULSE"), {
      target: { value: "TEMP" },
    });
    fireEvent.click(screen.getByText("Добавить поле"));
    fireEvent.change(screen.getByPlaceholderText("Код (lat)"), {
      target: { value: "result" },
    });
    fireEvent.change(screen.getByPlaceholderText("Название поля"), {
      target: { value: "Результат" },
    });

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea as HTMLTextAreaElement, {
      target: { value: "{{result}}" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Темповая",
          code: "TEMP",
          sortOrder: 0,
          schema: [
            expect.objectContaining({
              key: "result",
              label: "Результат",
              type: "text",
            }),
          ],
          calculations: [],
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("TemplateEditor должен показывать ошибку сохранения", async () => {
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
    const onSave = vi.fn().mockRejectedValue(new Error("save-failed"));
    const { container } = renderWithApp(
      <TemplateEditor
        initialValues={{
          name: "Кросс",
          schema: [],
          calculations: [],
          outputTemplate: "{{result}}",
        }}
        onSave={onSave}
      />
    );

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea as HTMLTextAreaElement, {
      target: { value: "{{result}}" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    consoleErrorMock.mockRestore();
  });

  it("TemplateManager должен удалять только пользовательский шаблон", async () => {
    renderWithApp(
      <TemplateManager
        userId={20}
        initialTemplates={[
          createTemplate(),
          createTemplate({
            id: 2,
            userId: null,
            name: "Глобальный",
            matchPattern: null,
          }),
        ]}
      />
    );

    const deleteButtons = screen.getAllByLabelText("Удалить");

    expect(deleteButtons[1]).toHaveProperty("disabled", true);

    fireEvent.click(deleteButtons[0]);
    fireEvent.click(await screen.findByRole("button", { name: "OK" }));

    await waitFor(() => {
      expect(templateMocks.deleteTemplateMock).toHaveBeenCalledWith(1);
    });

    expect(templateMocks.routerRefreshMock).toHaveBeenCalled();
    expect(screen.queryByText("Кросс")).toBeNull();
    expect(screen.getByText("Глобальный")).toBeTruthy();
  });
});
