import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PeriodRangeControls } from "@/app/diary/period/DiaryPeriodClient/components/PeriodRangeControls/PeriodRangeControls";

vi.mock("antd", () => {
  const RangePicker = ({
    onChange,
  }: {
    onChange?: (values: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange?.(null)}>
        range-null
      </button>
      <button type="button" onClick={() => onChange?.([dayjs("2026-06-01"), null])}>
        range-open
      </button>
      <button type="button" onClick={() => onChange?.([dayjs("2026-06-01"), dayjs("2026-06-07")])}>
        range-valid
      </button>
    </div>
  );

  return {
    Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
    Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    DatePicker: {
      RangePicker,
    },
  };
});

vi.mock("@ant-design/icons", () => ({
  DownloadOutlined: () => <span data-testid="download-icon" />,
}));

describe("PeriodRangeControls", () => {
  it("обрабатывает пресеты, экспорт и валидное изменение диапазона", () => {
    const onRangeChange = vi.fn();
    const onPresetRange = vi.fn();
    const onExport = vi.fn();

    render(
      <PeriodRangeControls
        range={[dayjs("2026-06-01"), dayjs("2026-06-07")]}
        exporting={false}
        onRangeChange={onRangeChange}
        onPresetRange={onPresetRange}
        onExport={onExport}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "range-null" }));
    fireEvent.click(screen.getByRole("button", { name: "range-open" }));
    expect(onRangeChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "range-valid" }));
    expect(onRangeChange).toHaveBeenCalledWith([dayjs("2026-06-01"), dayjs("2026-06-07")]);

    fireEvent.click(screen.getByRole("button", { name: "Последние 7 дней" }));
    fireEvent.click(screen.getByRole("button", { name: "Последние 30 дней" }));
    fireEvent.click(screen.getByRole("button", { name: "Выгрузить Excel" }));

    expect(onPresetRange.mock.calls.map(([value]) => value)).toEqual([7, 30]);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
