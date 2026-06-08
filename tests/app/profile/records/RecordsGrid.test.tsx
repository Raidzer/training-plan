import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { RecordsGrid } from "@/app/profile/records/RecordsClient/components/RecordsGrid/RecordsGrid";
import type { RecordRow } from "@/app/profile/records/RecordsClient/types/recordsTypes";

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

describe("RecordsGrid", () => {
  it("показывает loading state", () => {
    render(<RecordsGrid rows={[]} loading saving={false} errors={{}} onFieldChange={vi.fn()} />);

    expect(screen.getByText("Загрузка...")).toBeTruthy();
  });

  it("отправляет изменения полей строки", () => {
    const onFieldChange = vi.fn();

    render(
      <RecordsGrid
        rows={[createRow()]}
        loading={false}
        saving={false}
        errors={{
          "5k": {
            time: true,
            date: true,
            raceName: true,
            raceCity: true,
            url: true,
          },
        }}
        onFieldChange={onFieldChange}
      />
    );

    fireEvent.change(screen.getByDisplayValue("20:00"), { target: { value: "19:30" } });
    fireEvent.change(screen.getByDisplayValue("City Run"), { target: { value: "Fast Run" } });
    fireEvent.change(screen.getByDisplayValue("Moscow"), { target: { value: "Kazan" } });
    fireEvent.change(screen.getByDisplayValue("https://example.com"), {
      target: { value: "https://race.example.com" },
    });

    expect(onFieldChange).toHaveBeenNthCalledWith(1, "5k", { timeText: "19:30" });
    expect(onFieldChange).toHaveBeenNthCalledWith(2, "5k", { raceName: "Fast Run" });
    expect(onFieldChange).toHaveBeenNthCalledWith(3, "5k", { raceCity: "Kazan" });
    expect(onFieldChange).toHaveBeenNthCalledWith(4, "5k", {
      protocolUrl: "https://race.example.com",
    });
  });
});
