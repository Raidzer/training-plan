import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  PERSONAL_RECORD_DISTANCES,
} from "@/shared/constants/personalRecords.constants";
import {
  buildDefaultRows,
  buildRecordsPayload,
  getRecordsFromResponse,
  mapRecordsToRows,
  normalizeTimeText,
  validateRows,
} from "@/app/(protected)/profile/records/RecordsClient/utils/recordsUtils";
import type {
  ApiRecord,
  RecordRow,
} from "@/app/(protected)/profile/records/RecordsClient/types/recordsTypes";

function createRecordRow(overrides: Partial<RecordRow> = {}): RecordRow {
  return {
    distanceKey: "5k",
    label: "5 км",
    timeText: "",
    recordDate: null,
    protocolUrl: "",
    raceName: "",
    raceCity: "",
    ...overrides,
  };
}

describe("recordsUtils", () => {
  it("builds editable rows for every supported distance", () => {
    const rows = buildDefaultRows();

    expect(rows).toHaveLength(PERSONAL_RECORD_DISTANCES.length);
    expect(rows[0]).toMatchObject({
      distanceKey: PERSONAL_RECORD_DISTANCES[0].key,
      label: PERSONAL_RECORD_DISTANCES[0].label,
      timeText: "",
      recordDate: null,
    });
  });

  it("normalizes time text before validation and submit", () => {
    expect(normalizeTimeText("  00:39,25  ")).toBe("00:39.25");
    expect(normalizeTimeText("  ")).toBe("");
  });

  it("returns only valid records from API response", () => {
    const validRecord: ApiRecord = {
      distanceKey: "10k",
      timeText: "00:39:25",
      recordDate: "2026-05-10",
      protocolUrl: null,
      raceName: "Spring Run",
      raceCity: "Moscow",
    };

    expect(getRecordsFromResponse({ records: [validRecord] })).toEqual([validRecord]);
    expect(getRecordsFromResponse({ records: "invalid" })).toEqual([]);
    expect(getRecordsFromResponse(null)).toEqual([]);
  });

  it("maps API records to editable rows and ignores unknown distances", () => {
    const rows = mapRecordsToRows([
      {
        distanceKey: "5k",
        timeText: "00:18:30",
        recordDate: "2026-05-10",
        protocolUrl: "https://example.com/protocol",
        raceName: "Fast Run",
        raceCity: "Moscow",
      },
      {
        distanceKey: "unknown",
        timeText: "00:10:00",
        recordDate: "2026-05-11",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
    ]);

    const fiveKmRow = rows.find((row) => row.distanceKey === "5k");

    expect(fiveKmRow).toMatchObject({
      timeText: "00:18:30",
      protocolUrl: "https://example.com/protocol",
      raceName: "Fast Run",
      raceCity: "Moscow",
    });
    expect(fiveKmRow?.recordDate?.format("YYYY-MM-DD")).toBe("2026-05-10");
    expect(rows.some((row) => row.timeText === "00:10:00")).toBe(false);
  });

  it("validates record rows without depending on rendered form markup", () => {
    const longUrl = `https://example.com/${"a".repeat(MAX_PROTOCOL_URL_LENGTH)}`;
    const longRaceName = "a".repeat(MAX_RACE_NAME_LENGTH + 1);
    const longRaceCity = "a".repeat(MAX_RACE_CITY_LENGTH + 1);

    const result = validateRows([
      createRecordRow({
        distanceKey: "5k",
        timeText: "00:18:30",
        recordDate: dayjs("2026-05-10"),
      }),
      createRecordRow({
        distanceKey: "10k",
        timeText: "bad-time",
        recordDate: null,
        protocolUrl: longUrl,
        raceName: longRaceName,
        raceCity: longRaceCity,
      }),
      createRecordRow({
        distanceKey: "21_1k",
        timeText: "01:24:00",
        recordDate: null,
      }),
    ]);

    expect(result.hasTimeError).toBe(true);
    expect(result.hasDateError).toBe(true);
    expect(result.hasUrlError).toBe(true);
    expect(result.hasRaceNameError).toBe(true);
    expect(result.hasRaceCityError).toBe(true);
    expect(result.errors["5k"]).toBeUndefined();
    expect(result.errors["10k"]).toEqual({
      time: true,
      date: true,
      url: true,
      raceName: true,
      raceCity: true,
    });
    expect(result.errors["21_1k"]).toEqual({
      date: true,
    });
  });

  it("builds normalized records payload and clears optional fields for empty rows", () => {
    const payload = buildRecordsPayload([
      createRecordRow({
        distanceKey: "5k",
        timeText: "  00:18,30  ",
        recordDate: dayjs("2026-05-10"),
        protocolUrl: " https://example.com/protocol ",
        raceName: " Fast Run ",
        raceCity: " Moscow ",
      }),
      createRecordRow({
        distanceKey: "10k",
        protocolUrl: "https://example.com/ignored",
        raceName: "Ignored",
        raceCity: "Ignored",
      }),
    ]);

    expect(payload).toEqual([
      {
        distanceKey: "5k",
        timeText: "00:18.30",
        recordDate: "2026-05-10",
        protocolUrl: "https://example.com/protocol",
        raceName: "Fast Run",
        raceCity: "Moscow",
      },
      {
        distanceKey: "10k",
        timeText: "",
        recordDate: null,
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
    ]);
  });
});
