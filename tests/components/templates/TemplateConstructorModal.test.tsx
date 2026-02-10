import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TemplateConstructorModal } from "@/components/templates/TemplateConstructorModal";
import { findMatchingTemplateWithDetails, getTemplates } from "@/app/actions/diaryTemplates";
import { processTemplate } from "@/shared/utils/templateEngine";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";

vi.mock("@/app/actions/diaryTemplates", () => {
  return {
    getTemplates: vi.fn(),
    findMatchingTemplateWithDetails: vi.fn(),
  };
});

vi.mock("@/shared/utils/templateEngine", () => {
  return {
    processTemplate: vi.fn(),
  };
});

const mockedGetTemplates = vi.mocked(getTemplates);
const mockedFindMatchingTemplateWithDetails = vi.mocked(findMatchingTemplateWithDetails);
const mockedProcessTemplate = vi.mocked(processTemplate);

type MatchedTemplateWithDetails = {
  template: DiaryResultTemplate;
  index: number;
  length: number;
  matchedText: string;
};

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
  matchesWithDetails?: MatchedTemplateWithDetails[];
  visible?: boolean;
  taskText?: string;
  userId?: number;
};

function renderModal(options: RenderModalOptions = {}) {
  const {
    templates = [],
    matches = [],
    matchesWithDetails,
    visible = true,
    taskText = "run",
    userId = 1,
  } = options;

  const resolvedMatchesWithDetails =
    matchesWithDetails ??
    matches.map((template, index) => ({
      template,
      index,
      length: taskText.length,
      matchedText: taskText,
    }));

  mockedGetTemplates.mockResolvedValue(templates);
  mockedFindMatchingTemplateWithDetails.mockResolvedValue(resolvedMatchesWithDetails);

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
    expect(mockedFindMatchingTemplateWithDetails).toHaveBeenCalledWith(userId, taskText);
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

function getListInputsByFieldLabelAndIndex(label: string, labelIndex: number): HTMLInputElement[] {
  const fieldLabels = screen.getAllByText(label);
  const targetLabel = fieldLabels[labelIndex];
  if (!targetLabel) {
    throw new Error(`Field label "${label}" with index ${labelIndex} not found`);
  }

  const formItem = targetLabel.closest(".ant-form-item");
  if (!formItem) {
    throw new Error(`Form item for label "${label}" with index ${labelIndex} not found`);
  }

  const inputs = Array.from(formItem.querySelectorAll("input")) as HTMLInputElement[];
  if (inputs.length === 0) {
    throw new Error(`List inputs for label "${label}" with index ${labelIndex} not found`);
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

  it("должен строить одно фиксированное поле списка без listSize", async () => {
    const template = createTemplate({
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const { onApply } = renderModal({ templates: [template], matches: [template] });
    mockedProcessTemplate.mockReturnValue("Fixed list output");

    await waitForInitialLoad();

    await waitFor(() => {
      const initialInputs = getListInputsByFieldLabel("Splits");
      expect(initialInputs.length).toBe(1);
    });

    const initialInputs = getListInputsByFieldLabel("Splits");
    fireEvent.change(initialInputs[0], { target: { value: "00:01:02" } });
    expect(screen.queryByRole("button", { name: /Add value/i })).toBeNull();

    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(mockedProcessTemplate).toHaveBeenCalledTimes(1);
    });

    const processTemplateArgs = mockedProcessTemplate.mock.calls[0];
    const formValues = processTemplateArgs[1] as Record<string, unknown>;

    expect(formValues.splits).toEqual(["1:02"]);
    expect(onApply).toHaveBeenCalledWith("Fixed list output");
  });

  it("должен автоматически строить фиксированное количество полей по taskText", async () => {
    const template = createTemplate({
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });

    renderModal({
      templates: [template],
      matches: [template],
      taskText: "Тренировка: 12x400 м-с.к",
    });

    await waitForInitialLoad(1, "Тренировка: 12x400 м-с.к");

    await waitFor(() => {
      const listInputs = getListInputsByFieldLabel("Splits");
      expect(listInputs.length).toBe(12);
      expect(screen.queryByRole("button", { name: /Add value/i })).toBeNull();
    });
  });

  it("должен применять авторазмер списка отдельно для каждого блока по taskText", async () => {
    const templateA = createTemplate({
      id: 1,
      name: "Template A",
      code: "TA",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const templateB = createTemplate({
      id: 2,
      name: "Template B",
      code: "TB",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });

    renderModal({
      templates: [templateA, templateB],
      matches: [templateA, templateB],
      matchesWithDetails: [
        {
          template: templateA,
          index: 0,
          length: 6,
          matchedText: "6x400 м-с.к",
        },
        {
          template: templateB,
          index: 12,
          length: 6,
          matchedText: "5x200 м-с.к",
        },
      ],
      taskText: "Тренировка: 6x400 м-с.к + 5x200 м-с.к",
    });

    await waitForInitialLoad(1, "Тренировка: 6x400 м-с.к + 5x200 м-с.к");

    await waitFor(() => {
      const firstBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 0);
      const secondBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 1);
      expect(firstBlockInputs.length).toBe(6);
      expect(secondBlockInputs.length).toBe(5);
    });
  });

  it("должен брать repeatCount из контекста taskText, если matchedText не содержит префикс", async () => {
    const templateA = createTemplate({
      id: 1,
      name: "Template A",
      code: "TA",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const templateB = createTemplate({
      id: 2,
      name: "Template B",
      code: "TB",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });

    const taskText = "1км(200+200+600)+5x400 м-с.к";
    const firstMatchedText = "1км(200+200+600)";
    const secondMatchedText = "м-с.к";
    const firstIndex = taskText.indexOf(firstMatchedText);
    const secondIndex = taskText.indexOf(secondMatchedText);

    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThanOrEqual(0);

    renderModal({
      templates: [templateA, templateB],
      matchesWithDetails: [
        {
          template: templateA,
          index: firstIndex,
          length: firstMatchedText.length,
          matchedText: firstMatchedText,
        },
        {
          template: templateB,
          index: secondIndex,
          length: secondMatchedText.length,
          matchedText: secondMatchedText,
        },
      ],
      taskText,
    });

    await waitForInitialLoad(1, taskText);

    await waitFor(() => {
      const firstBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 0);
      const secondBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 1);
      expect(firstBlockInputs.length).toBe(1);
      expect(secondBlockInputs.length).toBe(5);
    });
  });

  it("не должен переносить repeatCount из предыдущего блока при контекстном парсинге", async () => {
    const templateA = createTemplate({
      id: 1,
      name: "Template A",
      code: "TA",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const templateB = createTemplate({
      id: 2,
      name: "Template B",
      code: "TB",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });

    const taskText = "5x400 м-с.к+1км(200+200+600)";
    const firstMatchedText = "м-с.к";
    const secondMatchedText = "1км(200+200+600)";
    const firstIndex = taskText.indexOf(firstMatchedText);
    const secondIndex = taskText.indexOf(secondMatchedText);

    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThanOrEqual(0);

    renderModal({
      templates: [templateA, templateB],
      matchesWithDetails: [
        {
          template: templateA,
          index: firstIndex,
          length: firstMatchedText.length,
          matchedText: firstMatchedText,
        },
        {
          template: templateB,
          index: secondIndex,
          length: secondMatchedText.length,
          matchedText: secondMatchedText,
        },
      ],
      taskText,
    });

    await waitForInitialLoad(1, taskText);

    await waitFor(() => {
      const firstBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 0);
      const secondBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 1);
      expect(firstBlockInputs.length).toBe(5);
      expect(secondBlockInputs.length).toBe(1);
    });
  });

  it("должен ставить размер списка 1 для блока без xN и не сдвигать следующий блок", async () => {
    const templateA = createTemplate({
      id: 1,
      name: "Template A",
      code: "TA",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const templateB = createTemplate({
      id: 2,
      name: "Template B",
      code: "TB",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });

    renderModal({
      templates: [templateA, templateB],
      matchesWithDetails: [
        {
          template: templateA,
          index: 0,
          length: 16,
          matchedText: "1км(200+200+600)",
        },
        {
          template: templateB,
          index: 17,
          length: 5,
          matchedText: "5x400",
        },
      ],
      taskText: "1км(200+200+600)+5x400",
    });

    await waitForInitialLoad(1, "1км(200+200+600)+5x400");

    await waitFor(() => {
      const firstBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 0);
      const secondBlockInputs = getListInputsByFieldLabelAndIndex("Splits", 1);
      expect(firstBlockInputs.length).toBe(1);
      expect(secondBlockInputs.length).toBe(5);
    });
  });

  it("не должен запрашивать шаблоны, если модалка скрыта", () => {
    renderModal({ visible: false, templates: [createTemplate()], matches: [createTemplate()] });

    expect(mockedGetTemplates).not.toHaveBeenCalled();
    expect(mockedFindMatchingTemplateWithDetails).not.toHaveBeenCalled();
  });

  it("не должен запрашивать шаблоны, если userId отсутствует", () => {
    renderModal({ userId: 0, templates: [createTemplate()], matches: [createTemplate()] });

    expect(mockedGetTemplates).not.toHaveBeenCalled();
    expect(mockedFindMatchingTemplateWithDetails).not.toHaveBeenCalled();
  });

  it("должен оставлять только селект ручного добавления, если совпадений нет", async () => {
    const template = createTemplate({ name: "Any template" });
    const { messageApi } = renderModal({ templates: [template], matches: [] });

    await waitForInitialLoad();

    expect(messageApi.success).not.toHaveBeenCalled();
    expect(document.querySelectorAll(".ant-select").length).toBe(1);
  });

  it("должен показывать количество найденных шаблонов в успех-сообщении", async () => {
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

  it("должен подставлять {{код}} из следующего блока и скрывать использованный блок", async () => {
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

  it("должен нормализовать время-поля перед передачей в processTemplate", async () => {
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

  it("должен автодобавлять блоки для комбинированной тренировки с темповым, 200 и 100", async () => {
    const tempoTemplate = createTemplate({
      id: 1,
      name: "Темповый бег до 27",
      matchPattern: "# км(до 27)(*:*)",
    });
    const force200Template = createTemplate({
      id: 2,
      name: "200 метров силовым бегом",
      matchPattern: "#x200 м-с.у. в гору силовым бегом",
    });
    const hill100Template = createTemplate({
      id: 3,
      name: "100 метров близко к max в гору",
      matchPattern: "#x100 м-близко к max в гору",
    });
    const tempoPulseTemplate = createTemplate({
      id: 4,
      name: "Темповый бег до 27 с пульсом",
      matchPattern: "# км(до 27)(*:*)(пульс)",
    });

    const taskText =
      "4 км(до 27)(4:05)+3 мин. отдыха+12x200 м-с.у. в гору силовым бегом(через 200 м(до 22)(1:20-1:40))+3 мин. отдыха+4x100 м-близко к max в гору(через 2 мин. отдыха)+3 мин. отдыха+3 км(до 27)(4:05)(пульс)";
    const tempoMatchText = "4 км(до 27)(4:05)";
    const force200MatchText = "12x200 м-с.у. в гору силовым бегом";
    const hill100MatchText = "4x100 м-близко к max в гору";
    const tempoPulseMatchText = "3 км(до 27)(4:05)(пульс)";

    renderModal({
      templates: [tempoTemplate, force200Template, hill100Template, tempoPulseTemplate],
      taskText,
      matchesWithDetails: [
        {
          template: tempoTemplate,
          index: taskText.indexOf(tempoMatchText),
          length: tempoMatchText.length,
          matchedText: tempoMatchText,
        },
        {
          template: force200Template,
          index: taskText.indexOf(force200MatchText),
          length: force200MatchText.length,
          matchedText: force200MatchText,
        },
        {
          template: hill100Template,
          index: taskText.indexOf(hill100MatchText),
          length: hill100MatchText.length,
          matchedText: hill100MatchText,
        },
        {
          template: tempoPulseTemplate,
          index: taskText.indexOf(tempoPulseMatchText),
          length: tempoPulseMatchText.length,
          matchedText: tempoPulseMatchText,
        },
      ],
    });

    await waitForInitialLoad(1, taskText);

    await waitFor(() => {
      const valueNodes = Array.from(
        document.querySelectorAll(
          ".ant-select-content-value[title], .ant-select-selection-item[title]"
        )
      );
      const expectedNames = [
        "Темповый бег до 27",
        "200 метров силовым бегом",
        "100 метров близко к max в гору",
        "Темповый бег до 27 с пульсом",
      ];
      const selectedBlockNames = valueNodes
        .map((node) => node.getAttribute("title") ?? "")
        .filter((value) => expectedNames.includes(value));
      const uniqueSelectedNames = new Set(selectedBlockNames);

      expect(uniqueSelectedNames.has("Темповый бег до 27")).toBe(true);
      expect(uniqueSelectedNames.has("200 метров силовым бегом")).toBe(true);
      expect(uniqueSelectedNames.has("100 метров близко к max в гору")).toBe(true);
      expect(uniqueSelectedNames.has("Темповый бег до 27 с пульсом")).toBe(true);
      expect(uniqueSelectedNames.size).toBe(4);
    });
  });

  it("no duplicate block for xN repeats in taskText", async () => {
    const template = createTemplate({
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const { onApply } = renderModal({
      templates: [template],
      matches: [template],
      taskText: "Training: 12x200",
    });
    mockedProcessTemplate.mockReturnValue("200 block");

    await waitForInitialLoad(1, "Training: 12x200");

    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith("200 block");
    });

    expect(mockedProcessTemplate).toHaveBeenCalledTimes(1);
  });

  it("должен быть идемпотентным при повторном применении без изменений формы", async () => {
    const template = createTemplate({
      id: 11,
      name: "Single block",
      code: "SINGLE",
      schema: [{ key: "splits", label: "Splits", type: "list", itemType: "time" }],
    });
    const { onApply } = renderModal({
      templates: [template],
      matches: [template],
      taskText: "6x200",
    });
    mockedProcessTemplate.mockReturnValue("Один блок");

    await waitForInitialLoad(1, "6x200");

    fireEvent.click(getApplyButton());
    await waitFor(() => {
      expect(onApply).toHaveBeenNthCalledWith(1, "Один блок");
    });

    fireEvent.click(getApplyButton());
    await waitFor(() => {
      expect(onApply).toHaveBeenNthCalledWith(2, "Один блок");
    });

    expect(onApply).toHaveBeenCalledTimes(2);
  });

  it("не должен увеличивать количество блоков после повторного открытия модалки", async () => {
    const tempoTemplate = createTemplate({ id: 21, name: "Tempo", code: "T1" });
    const force200Template = createTemplate({ id: 22, name: "200", code: "T2" });
    const force100Template = createTemplate({ id: 23, name: "100", code: "T3" });

    const templates = [tempoTemplate, force200Template, force100Template];
    const taskText = "4км темповый + 12x200 + 4x100";
    const matchesWithDetails = [
      {
        template: tempoTemplate,
        index: taskText.indexOf("4км"),
        length: "4км темповый".length,
        matchedText: "4км темповый",
      },
      {
        template: force200Template,
        index: taskText.indexOf("12x200"),
        length: "12x200".length,
        matchedText: "12x200",
      },
      {
        template: force100Template,
        index: taskText.indexOf("4x100"),
        length: "4x100".length,
        matchedText: "4x100",
      },
    ];

    mockedProcessTemplate.mockImplementation((template) => {
      if (template.id === 21) {
        return "Темповый";
      }
      if (template.id === 22) {
        return "200м";
      }
      if (template.id === 23) {
        return "100м";
      }
      return "";
    });

    const first = renderModal({
      templates,
      matchesWithDetails,
      taskText,
    });

    await waitForInitialLoad(1, taskText);
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(first.onApply).toHaveBeenCalledWith("Темповый\n\n200м\n\n100м");
    });

    cleanup();

    const second = renderModal({
      templates,
      matchesWithDetails,
      taskText,
    });

    await waitForInitialLoad(1, taskText);
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(second.onApply).toHaveBeenCalledWith("Темповый\n\n200м\n\n100м");
    });
  });

  it("не должен каскадно размножать блоки при нескольких {{CODE}} и одинаковых кодах", async () => {
    const headTemplate = createTemplate({ id: 31, name: "Head", code: "HEAD" });
    const blockB1Template = createTemplate({ id: 32, name: "B1", code: "B" });
    const blockB2Template = createTemplate({ id: 33, name: "B2", code: "B" });
    const tailTemplate = createTemplate({ id: 34, name: "Tail", code: "TAIL" });
    const { onApply } = renderModal({
      templates: [headTemplate, blockB1Template, blockB2Template, tailTemplate],
      matches: [headTemplate, blockB1Template, blockB2Template, tailTemplate],
    });

    mockedProcessTemplate.mockImplementation((template) => {
      if (template.id === 31) {
        return "Head {{B}} {{B}}";
      }
      if (template.id === 32) {
        return "B1";
      }
      if (template.id === 33) {
        return "B2";
      }
      if (template.id === 34) {
        return "Tail";
      }
      return "";
    });

    await waitForInitialLoad();
    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith("Head B1 B2\n\nTail");
    });
  });
});
