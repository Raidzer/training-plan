import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";

import { RecordsNavigator } from "@/app/(protected)/profile/records/RecordsClient/components/RecordsNavigator/RecordsNavigator";
import { RECORDS_LABELS } from "@/app/(protected)/profile/records/RecordsClient/constants/recordsConstants";
import { buildDefaultRows } from "@/app/(protected)/profile/records/RecordsClient/utils/recordsUtils";

function createRows() {
  return buildDefaultRows().map((row) => {
    if (row.distanceKey === "5k") {
      return {
        ...row,
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
      };
    }

    return row;
  });
}

describe("RecordsNavigator", () => {
  it("groups distances and exposes current, filled, and invalid states", () => {
    const onSelect = vi.fn();

    render(
      <RecordsNavigator
        rows={createRows()}
        selectedDistanceKey="10k"
        errors={{ "10k": { date: true } }}
        disabled={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole("navigation", { name: RECORDS_LABELS.navigatorLabel })).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: RECORDS_LABELS.roadGroupTitle })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: RECORDS_LABELS.trackGroupTitle })
    ).toBeTruthy();

    const currentButton = screen.getByRole("button", { name: /^10 км/ });
    expect(currentButton.getAttribute("aria-current")).toBe("true");
    expect(screen.getByText(RECORDS_LABELS.invalidStatus)).toBeTruthy();
    expect(screen.getAllByText(RECORDS_LABELS.completedStatus).length).toBeGreaterThan(0);
    expect(screen.getAllByText("00:18:30").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /^5 км/ }));
    expect(onSelect).toHaveBeenCalledWith("5k");
  });

  it("supports the compact selector and disabled navigation state", () => {
    const onSelect = vi.fn();

    render(
      <RecordsNavigator
        rows={createRows()}
        selectedDistanceKey="5k"
        errors={{}}
        disabled
        onSelect={onSelect}
      />
    );

    const selector = screen.getByLabelText(RECORDS_LABELS.mobileSelectorLabel) as HTMLSelectElement;
    expect(selector.disabled).toBe(true);
    expect(
      screen.getAllByRole("button").every((button) => (button as HTMLButtonElement).disabled)
    ).toBe(true);
  });

  it("changes distance through the compact selector", () => {
    const onSelect = vi.fn();

    render(
      <RecordsNavigator
        rows={createRows()}
        selectedDistanceKey="5k"
        errors={{}}
        disabled={false}
        onSelect={onSelect}
      />
    );

    fireEvent.change(screen.getByLabelText(RECORDS_LABELS.mobileSelectorLabel), {
      target: { value: "10k" },
    });

    expect(onSelect).toHaveBeenCalledWith("10k");
  });
});
