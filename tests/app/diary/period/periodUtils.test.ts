import dayjs from "dayjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFullDiaryExportFilename,
  createPeriodExportFilename,
  createPeriodRange,
  downloadBlob,
  formatDistanceMetric,
  formatDistanceValue,
  formatPeriodApiDate,
  formatPeriodDisplayDate,
  formatRecoveryStatus,
  formatWeightStatus,
  formatWorkoutStatus,
  getFilenameFromContentDisposition,
} from "@/app/(protected)/diary/period/DiaryPeriodClient/utils/periodUtils";

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe("periodUtils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });

  it("formats period dates for API and display", () => {
    const date = dayjs("2026-05-10");

    expect(formatPeriodApiDate(date)).toBe("2026-05-10");
    expect(formatPeriodDisplayDate("2026-05-10")).toBe("10.05.2026");
  });

  it("creates an inclusive period range for the requested number of days", () => {
    const range = createPeriodRange(14);

    expect(range).toHaveLength(2);
    expect(range[1].diff(range[0], "day")).toBe(13);
  });

  it("formats compact status and distance values for export table cells", () => {
    expect(formatWeightStatus(true, false)).toBe("У / -");
    expect(formatRecoveryStatus(true, false, true)).toBe("Б / - / М");
    expect(formatWorkoutStatus(1, 2)).toBe("1/2");
    expect(formatDistanceValue(12.345)).toBe("12.35");
    expect(formatDistanceMetric(12.345)).toBe("12.35 км");
  });

  it("creates export filename and extracts filename from response headers", () => {
    expect(createPeriodExportFilename("2026-05-01", "2026-05-10")).toBe(
      "diary_2026-05-01_2026-05-10.xlsx"
    );
    expect(createFullDiaryExportFilename()).toBe("diary_all.xlsx");

    expect(getFilenameFromContentDisposition('attachment; filename="diary.xlsx"')).toBe(
      "diary.xlsx"
    );
    expect(getFilenameFromContentDisposition("attachment")).toBeNull();
    expect(getFilenameFromContentDisposition(null)).toBeNull();
  });

  it("downloads blob through a temporary link and revokes object URL", () => {
    const createObjectURLMock = vi.fn(() => "blob:period-export");
    const revokeObjectURLMock = vi.fn();
    const clickMock = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURLMock,
    });

    const blob = new Blob(["report"]);

    downloadBlob(blob, "period.xlsx");

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector("a")).toBeNull();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:period-export");
  });
});
