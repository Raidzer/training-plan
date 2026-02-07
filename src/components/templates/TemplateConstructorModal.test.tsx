import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TemplateConstructorModal } from "./TemplateConstructorModal";
import { findMatchingTemplate, getTemplates } from "@/app/actions/diaryTemplates";
import { processTemplate } from "@/shared/utils/templateEngine";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";

vi.mock("@/app/actions/diaryTemplates", () => {
  return {
    getTemplates: vi.fn(),
    findMatchingTemplate: vi.fn(),
  };
});

vi.mock("@/shared/utils/templateEngine", () => {
  return {
    processTemplate: vi.fn(),
  };
});

const mockedGetTemplates = vi.mocked(getTemplates);
const mockedFindMatchingTemplate = vi.mocked(findMatchingTemplate);
const mockedProcessTemplate = vi.mocked(processTemplate);

function createTemplate(overrides: Partial<DiaryResultTemplate> = {}): DiaryResultTemplate {
  return {
    id: 1,
    userId: 1,
    name: "Template",
    code: "TMP",
    matchPattern: "run",
    schema: [],
    outputTemplate: "{{note}}",
    isInline: false,
    calculations: [],
    sortOrder: 0,
    type: "common",
    level: "general",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMessageApiMock() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    open: vi.fn(),
    destroy: vi.fn(),
  };
}

type RenderModalOptions = {
  templates?: DiaryResultTemplate[];
  matches?: DiaryResultTemplate[];
  visible?: boolean;
  taskText?: string;
  userId?: number;
};

function renderModal(options: RenderModalOptions = {}) {
  const { templates = [], matches = [], visible = true, taskText = "run", userId = 1 } = options;

  mockedGetTemplates.mockResolvedValue(templates);
  mockedFindMatchingTemplate.mockResolvedValue(matches);

  const onCancel = vi.fn();
  const onApply = vi.fn();
  const messageApi = createMessageApiMock();

  render(
    <TemplateConstructorModal
      visible={visible}
      onCancel={onCancel}
      onApply={onApply}
      taskText={taskText}
      userId={userId}
      messageApi={messageApi as any}
    />
  );

  return {
    onCancel,
    onApply,
    messageApi,
  };
}

async function waitForInitialLoad(userId = 1, taskText = "run") {
  await waitFor(() => {
    expect(mockedGetTemplates).toHaveBeenCalledWith(userId);
    expect(mockedFindMatchingTemplate).toHaveBeenCalledWith(userId, taskText);
  });

  await waitFor(() => {
    const applyButton = document.querySelector("button.ant-btn-primary");
    expect(applyButton).not.toBeNull();
  });
}

function getApplyButton(): HTMLButtonElement {
  const applyButton = document.querySelector("button.ant-btn-primary");
  if (!applyButton) {
    throw new Error("Apply button not found");
  }

  return applyButton as HTMLButtonElement;
}

function getAddBlockButton(): HTMLButtonElement {
  const addButton = document.querySelector("button.ant-btn-dashed");
  if (!addButton) {
    throw new Error("Add block button not found");
  }

  return addButton as HTMLButtonElement;
}

function getInputByFieldLabel(label: string): HTMLInputElement {
  const fieldLabel = screen.getByText(label);
  const formItem = fieldLabel.closest(".ant-form-item");
  if (!formItem) {
    throw new Error(`Form item for label "${label}" not found`);
  }

  const input = formItem.querySelector("input");
  if (!input) {
    throw new Error(`Input for label "${label}" not found`);
  }

  return input as HTMLInputElement;
}

function getListInputsByFieldLabel(label: string): HTMLInputElement[] {
  const fieldLabel = screen.getByText(label);
  const formItem = fieldLabel.closest(".ant-form-item");
  if (!formItem) {
    throw new Error(`Form item for label "${label}" not found`);
  }

  const inputs = Array.from(formItem.querySelectorAll("input")) as HTMLInputElement[];
  if (inputs.length === 0) {
    throw new Error(`List inputs for label "${label}" not found`);
  }

  return inputs;
}

async function selectOptionInSelect(selectIndex: number, optionLabel: string) {
  const selectItems = Array.from(document.querySelectorAll(".ant-select"));
  const targetSelect = selectItems[selectIndex];
  if (!targetSelect) {
    throw new Error(`Select with index ${selectIndex} not found`);
  }

  const selector =
    targetSelect.querySelector(".ant-select-content") ||
    targetSelect.querySelector(".ant-select-selector") ||
    targetSelect;
  if (!selector) {
    throw new Error(`Selector trigger for select with index ${selectIndex} not found`);
  }

  fireEvent.mouseDown(selector);

  await waitFor(() => {
    const option = Array.from(document.querySelectorAll(".ant-select-item-option")).find((item) =>
      item.textContent?.includes(optionLabel)
    );
    expect(option).toBeTruthy();
  });

  const optionToClick = Array.from(document.querySelectorAll(".ant-select-item-option")).find(
    (item) => item.textContent?.includes(optionLabel)
  );
  if (!optionToClick) {
    throw new Error(`Option "${optionLabel}" not found`);
  }

  fireEvent.click(optionToClick);
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });

  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });
});

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockedProcessTemplate.mockReturnValue("");
});

describe("TemplateConstructorModal", () => {
  it("должен подставлять defaultValue в поля формы после автоподбора шаблона", async () => {
    const template = createTemplate({
      schema: [
        { key: "note", label: "Note", type: "text", defaultValue: "Default note" },
        {
          key: "splits",
          label: "Splits",
          type: "list",
          listSize: 3,
          itemType: "text",
          defaultValue: "200; 400; 600",
        },
      ],
    });

    renderModal({ templates: [template], matches: [template] });

    await waitForInitialLoad();

    await waitFor(() => {
      expect(screen.getAllByDisplayValue("Default note").length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue("200").length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue("400").length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue("600").length).toBeGreaterThan(0);
    });
  });

  it("должен ограничивать defaultValue списка по listSize", async () => {
    const template = createTemplate({
      schema: [
        {
          key: "splits",
          label: "Splits",
          type: "list",
          listSize: 2,
          itemType: "text",
          defaultValue: "split-A; split-B; split-C",
        },
      ],
    });

    renderModal({ templates: [template], matches: [template] });
    await waitForInitialLoad();

    await waitFor(() => {
      expect(screen.getAllByDisplayValue("split-A").length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue("split-B").length).toBeGreaterThan(0);
      expect(screen.queryAllByDisplayValue("split-C").length).toBe(0);
    });
  });

  it("должен показывать динамический список без listSize и фильтровать пустые элементы", async () => {
    const template = createTemplate({
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const { onApply } = renderModal({ templates: [template], matches: [template] });
    mockedProcessTemplate.mockReturnValue("Dynamic list output");

    await waitForInitialLoad();

    await waitFor(() => {
      const initialInputs = getListInputsByFieldLabel("Splits");
      expect(initialInputs.length).toBe(1);
    });

    const initialInputs = getListInputsByFieldLabel("Splits");
    fireEvent.change(initialInputs[0], { target: { value: "00:01:02" } });
    fireEvent.click(screen.getByRole("button", { name: /Add value/i }));

    await waitFor(() => {
      const expandedInputs = getListInputsByFieldLabel("Splits");
      expect(expandedInputs.length).toBe(2);
    });

    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(mockedProcessTemplate).toHaveBeenCalledTimes(1);
    });

    const processTemplateArgs = mockedProcessTemplate.mock.calls[0];
    const formValues = processTemplateArgs[1] as Record<string, unknown>;

    expect(formValues.splits).toEqual(["1:02"]);
    expect(onApply).toHaveBeenCalledWith("Dynamic list output");
  });

  it("не должен запрашивать шаблоны, если модалка скрыта", () => {
    renderModal({ visible: false, templates: [createTemplate()], matches: [createTemplate()] });

    expect(mockedGetTemplates).not.toHaveBeenCalled();
    expect(mockedFindMatchingTemplate).not.toHaveBeenCalled();
  });

  it("не должен запрашивать шаблоны, если userId отсутствует", () => {
    renderModal({ userId: 0, templates: [createTemplate()], matches: [createTemplate()] });

    expect(mockedGetTemplates).not.toHaveBeenCalled();
    expect(mockedFindMatchingTemplate).not.toHaveBeenCalled();
  });

  it("должен оставлять только селект ручного добавления, если совпадений нет", async () => {
    const template = createTemplate({ name: "Any template" });
    const { messageApi } = renderModal({ templates: [template], matches: [] });

    await waitForInitialLoad();

    expect(messageApi.success).not.toHaveBeenCalled();
    expect(document.querySelectorAll(".ant-select").length).toBe(1);
  });

  it("должен показывать количество найденных шаблонов в success-сообщении", async () => {
    const templateA = createTemplate({ id: 1, name: "A" });
    const templateB = createTemplate({ id: 2, name: "B", code: "TB" });
    const { messageApi } = renderModal({
      templates: [templateA, templateB],
      matches: [templateA, templateB],
    });

    await waitForInitialLoad();

    expect(messageApi.success).toHaveBeenCalledTimes(1);
    expect(messageApi.success).toHaveBeenCalledWith(expect.stringContaining("2"));
  });

  it("должен добавлять блок вручную и сбрасывать выбор шаблона для добавления", async () => {
    const template = createTemplate({
      id: 1,
      name: "Manual template",
      schema: [{ key: "note", label: "Note", type: "text", defaultValue: "Manual note" }],
    });

    renderModal({ templates: [template], matches: [] });
    await waitForInitialLoad();

    const addButton = getAddBlockButton();
    expect(addButton.disabled).toBe(true);

    await selectOptionInSelect(0, "Manual template");
    await waitFor(() => {
      expect(addButton.disabled).toBe(false);
    });

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getAllByDisplayValue("Manual note").length).toBeGreaterThan(0);
      expect(addButton.disabled).toBe(true);
    });
  });

  it("должен сбрасывать старые значения при смене шаблона блока", async () => {
    const templateOne = createTemplate({
      id: 1,
      name: "Template one",
      schema: [{ key: "note", label: "Note", type: "text", defaultValue: "Old value" }],
    });
    const templateTwo = createTemplate({
      id: 2,
      name: "Template two",
      code: "TWO",
      schema: [{ key: "distance", label: "Distance", type: "number", defaultValue: "7" }],
    });

    renderModal({ templates: [templateOne, templateTwo], matches: [templateOne] });
    await waitForInitialLoad();

    await waitFor(() => {
      expect(screen.getAllByDisplayValue("Old value").length).toBeGreaterThan(0);
    });

    await selectOptionInSelect(0, "Template two");

    await waitFor(() => {
      expect(screen.queryAllByDisplayValue("Old value").length).toBe(0);
      expect(screen.getAllByDisplayValue("7").length).toBeGreaterThan(0);
    });
  });

  it("должен парсить defaultValue чисел и игнорировать невалидные значения", async () => {
    const template = createTemplate({
      schema: [
        { key: "distance", label: "Distance", type: "number", defaultValue: "12,5" },
        { key: "invalidNumber", label: "Invalid", type: "number", defaultValue: "abc" },
      ],
    });

    renderModal({ templates: [template], matches: [template] });
    await waitForInitialLoad();

    await waitFor(() => {
      expect(screen.getAllByDisplayValue("12.5").length).toBeGreaterThan(0);
      expect(screen.queryAllByDisplayValue("abc").length).toBe(0);
    });
  });

  it("должен собирать итоговый отчет с учетом inline-блоков", async () => {
    const templateA = createTemplate({ id: 1, name: "A", code: "A", isInline: false });
    const templateB = createTemplate({ id: 2, name: "B", code: "B", isInline: true });
    const templateC = createTemplate({ id: 3, name: "C", code: "C", isInline: false });
    const { onApply } = renderModal({
      templates: [templateA, templateB, templateC],
      matches: [templateA, templateB, templateC],
    });

    mockedProcessTemplate.mockImplementation((template) => {
      if (template.id === 1) {
        return "First";
      }
      if (template.id === 2) {
        return "Second";
      }
      if (template.id === 3) {
        return "Third";
      }
      return "";
    });

    await waitForInitialLoad();
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith("First Second\n\nThird");
    });
  });

  it("должен подставлять {{CODE}} из следующего блока и скрывать использованный блок", async () => {
    const templateA = createTemplate({ id: 1, name: "A", code: "A" });
    const templateB = createTemplate({ id: 2, name: "B", code: "B" });
    const templateC = createTemplate({ id: 3, name: "C", code: "C" });
    const { onApply } = renderModal({
      templates: [templateA, templateB, templateC],
      matches: [templateA, templateB, templateC],
    });

    mockedProcessTemplate.mockImplementation((template) => {
      if (template.id === 1) {
        return "Start {{B}}";
      }
      if (template.id === 2) {
        return "Inserted";
      }
      if (template.id === 3) {
        return "Tail";
      }
      return "";
    });

    await waitForInitialLoad();
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith("Start Inserted\n\nTail");
    });
  });

  it("не должен применять отчет при невалидном формате времени", async () => {
    const template = createTemplate({
      schema: [{ key: "time", label: "Time", type: "time" }],
    });
    const { onApply } = renderModal({ templates: [template], matches: [template] });

    await waitForInitialLoad();

    const timeInput = getInputByFieldLabel("Time");
    fireEvent.change(timeInput, { target: { value: "12" } });
    fireEvent.blur(timeInput);

    await waitFor(() => {
      const invalidMessage = document.querySelectorAll(".ant-form-item-explain-error");
      expect(invalidMessage.length).toBeGreaterThan(0);
    });

    expect(onApply).not.toHaveBeenCalled();
    expect(mockedProcessTemplate).not.toHaveBeenCalled();
  });

  it("должен нормализовать time-поля перед передачей в processTemplate", async () => {
    const template = createTemplate({
      schema: [
        { key: "time", label: "Time", type: "time" },
        { key: "splits", label: "Splits", type: "list", itemType: "time", listSize: 2 },
      ],
    });
    const { onApply } = renderModal({ templates: [template], matches: [template] });

    mockedProcessTemplate.mockReturnValue("Normalized output");

    await waitForInitialLoad();

    fireEvent.change(getInputByFieldLabel("Time"), { target: { value: "00:05:07" } });
    const splitInputs = getListInputsByFieldLabel("Splits");
    fireEvent.change(splitInputs[0], { target: { value: "00:01:02" } });
    fireEvent.change(splitInputs[1], { target: { value: "00:02:03" } });
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(mockedProcessTemplate).toHaveBeenCalledTimes(1);
    });

    const processTemplateArgs = mockedProcessTemplate.mock.calls[0];
    const formValues = processTemplateArgs[1] as Record<string, unknown>;

    expect(formValues.time).toBe("5:07");
    expect(formValues.splits).toEqual(["1:02", "2:03"]);
    expect(onApply).toHaveBeenCalledWith("Normalized output");
  });

  it("должен менять порядок отчета после перемещения блока вниз", async () => {
    const templateA = createTemplate({ id: 1, name: "A", code: "A" });
    const templateB = createTemplate({ id: 2, name: "B", code: "B" });
    const { onApply } = renderModal({
      templates: [templateA, templateB],
      matches: [templateA, templateB],
    });

    mockedProcessTemplate.mockImplementation((template) => {
      if (template.id === 1) {
        return "First";
      }
      if (template.id === 2) {
        return "Second";
      }
      return "";
    });

    await waitForInitialLoad();

    const moveDownButtons = Array.from(document.querySelectorAll("button")).filter((button) =>
      Boolean(button.querySelector(".anticon-arrow-down"))
    );
    expect(moveDownButtons.length).toBeGreaterThan(0);

    fireEvent.click(moveDownButtons[0]);
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith("Second\n\nFirst");
    });
  });

  it("должен исключать удаленный блок из итогового отчета", async () => {
    const templateA = createTemplate({ id: 1, name: "A", code: "A" });
    const templateB = createTemplate({ id: 2, name: "B", code: "B" });
    const { onApply } = renderModal({
      templates: [templateA, templateB],
      matches: [templateA, templateB],
    });

    mockedProcessTemplate.mockImplementation((template) => {
      if (template.id === 1) {
        return "First";
      }
      if (template.id === 2) {
        return "Second";
      }
      return "";
    });

    await waitForInitialLoad();

    const removeButtons = Array.from(document.querySelectorAll("button")).filter((button) => {
      return button.className.includes("dangerous");
    });
    expect(removeButtons.length).toBeGreaterThan(0);

    fireEvent.click(removeButtons[0]);
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith("Second");
    });
  });
});
