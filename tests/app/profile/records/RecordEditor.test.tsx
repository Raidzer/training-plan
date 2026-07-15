import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { RecordEditor } from "@/app/(protected)/profile/records/RecordsClient/components/RecordEditor/RecordEditor";
import {
  RECORD_FIELD_ERROR_MESSAGES,
  RECORDS_LABELS,
} from "@/app/(protected)/profile/records/RecordsClient/constants/recordsConstants";
import type { RecordRow } from "@/app/(protected)/profile/records/RecordsClient/types/recordsTypes";

function createRow(overrides: Partial<RecordRow> = {}): RecordRow {
  return {
    distanceKey: "5k",
    label: "5 км",
    timeText: "20:00",
    recordDate: dayjs("2026-06-01"),
    protocolUrl: "https://example.com",
    raceName: "City Run",
    raceCity: "Moscow",
    ...overrides,
  };
}

function renderEditor(overrides: Partial<ComponentProps<typeof RecordEditor>> = {}) {
  const props: ComponentProps<typeof RecordEditor> = {
    row: createRow(),
    errors: {},
    saving: false,
    disabled: false,
    hasChanges: true,
    saveError: false,
    validationAttempt: 0,
    onFieldChange: vi.fn(),
    onClearRecord: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<RecordEditor {...props} />),
    props,
  };
}

describe("RecordEditor", () => {
  it("renders labelled record fields and submits the form", () => {
    const { props } = renderEditor();

    expect(screen.getByRole("heading", { level: 2, name: "5 км" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /^Время/ })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /^Дата/ })).toBeTruthy();
    expect(screen.getByLabelText(RECORDS_LABELS.raceNameLabel)).toBeTruthy();
    expect(screen.getByLabelText(RECORDS_LABELS.raceCityLabel)).toBeTruthy();

    const protocolInput = screen.getByLabelText(RECORDS_LABELS.protocolLabel);
    expect(protocolInput.getAttribute("type")).toBe("url");

    fireEvent.change(screen.getByRole("textbox", { name: /^Время/ }), {
      target: { value: "19:30" },
    });
    fireEvent.change(screen.getByLabelText(RECORDS_LABELS.raceNameLabel), {
      target: { value: "Fast Run" },
    });
    const form = screen.getByRole("button", { name: /Сохранить изменения$/ }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(props.onFieldChange).toHaveBeenNthCalledWith(1, "5k", {
      timeText: "19:30",
    });
    expect(props.onFieldChange).toHaveBeenNthCalledWith(2, "5k", {
      raceName: "Fast Run",
    });
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("announces inline errors and focuses the first invalid field", () => {
    renderEditor({
      errors: {
        time: true,
        date: true,
        raceName: true,
        raceCity: true,
        url: true,
      },
      saveError: true,
      validationAttempt: 1,
    });

    const timeInput = screen.getByRole("textbox", { name: /^Время/ });

    expect(timeInput.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(timeInput);
    expect(screen.getByText(RECORD_FIELD_ERROR_MESSAGES.time)).toBeTruthy();
    expect(screen.getByText(RECORD_FIELD_ERROR_MESSAGES.date)).toBeTruthy();
    expect(screen.getByText(RECORD_FIELD_ERROR_MESSAGES.raceName)).toBeTruthy();
    expect(screen.getByText(RECORD_FIELD_ERROR_MESSAGES.raceCity)).toBeTruthy();
    expect(screen.getByText(RECORD_FIELD_ERROR_MESSAGES.url)).toBeTruthy();
    expect(screen.getByText(RECORDS_LABELS.saveErrorDescription)).toBeTruthy();
  });

  it("clears an existing draft and disables actions when required", () => {
    const { props, rerender } = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Очистить запись$/ }));
    expect(props.onClearRecord).toHaveBeenCalledWith("5k");

    rerender(
      <RecordEditor
        {...props}
        row={createRow({
          timeText: "",
          recordDate: null,
          protocolUrl: "",
          raceName: "",
          raceCity: "",
        })}
        disabled
        hasChanges={false}
      />
    );

    expect(
      (screen.getByRole("button", { name: /Очистить запись$/ }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /Сохранить изменения$/ }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(screen.getByText(RECORDS_LABELS.savedState)).toBeTruthy();
  });
});
