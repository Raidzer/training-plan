import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecordsOverview } from "@/app/(protected)/profile/records/RecordsClient/components/RecordsOverview/RecordsOverview";
import { RECORDS_LABELS } from "@/app/(protected)/profile/records/RecordsClient/constants/recordsConstants";
import { buildDefaultRows } from "@/app/(protected)/profile/records/RecordsClient/utils/recordsUtils";

function expectMetric(label: string, value: string) {
  const term = screen.getByText(label);
  expect(term.nextElementSibling?.textContent).toBe(value);
}

describe("RecordsOverview", () => {
  it("shows total, completed, and protocol counts", () => {
    const rows = buildDefaultRows().map((row) => {
      if (row.distanceKey === "5k") {
        return {
          ...row,
          timeText: "00:18:30",
          protocolUrl: "https://example.com/protocol",
        };
      }

      if (row.distanceKey === "10k") {
        return {
          ...row,
          timeText: "00:39:00",
        };
      }

      return row;
    });

    render(<RecordsOverview rows={rows} loading={false} loadError={false} />);

    expect(screen.getByRole("region", { name: RECORDS_LABELS.overviewLabel })).toBeTruthy();
    expectMetric(RECORDS_LABELS.totalDistancesLabel, String(rows.length));
    expectMetric(RECORDS_LABELS.completedRecordsLabel, "2");
    expectMetric(RECORDS_LABELS.protocolsLabel, "1");
  });

  it.each([
    ["loading", true, false, RECORDS_LABELS.loadingText],
    ["load error", false, true, RECORDS_LABELS.loadErrorTitle],
  ] as const)("announces the %s state instead of stale metrics", (_, loading, loadError, label) => {
    render(<RecordsOverview rows={buildDefaultRows()} loading={loading} loadError={loadError} />);

    const overview = screen.getByRole("region", { name: RECORDS_LABELS.overviewLabel });
    expect(overview.getAttribute("aria-busy")).toBe(String(loading));
    expect(screen.getAllByText(label)).toHaveLength(3);
    expectMetric(RECORDS_LABELS.totalDistancesLabel, "—" + label);
  });
});
