import { describe, expect, it } from "vitest";

import {
  buildMetaItems,
  formatResultDate,
  formatResultsCount,
  groupResultsByDistance,
  mapClubRecordsToResults,
  sortResults,
  splitRecords,
} from "@/app/results/ResultsClient/utils/resultsUtils";
import type {
  ResultsDistanceKey,
  ResultsEntry,
} from "@/app/results/ResultsClient/types/resultsTypes";
import type { ClubRecord } from "@/server/personalRecords";

function createClubRecord(overrides: Partial<ClubRecord> = {}): ClubRecord {
  return {
    id: 1,
    userId: 10,
    userName: "Иван",
    userLastName: "Петров",
    userGender: "male",
    distanceKey: "5k",
    timeText: "00:18:30.50",
    recordDate: "2026-05-10",
    protocolUrl: "https://example.com/protocol",
    raceName: "Spring Run",
    raceCity: "Moscow",
    ...overrides,
  };
}

function createResult(
  distanceKey: ResultsDistanceKey,
  overrides: Partial<ResultsEntry> = {}
): ResultsEntry {
  return {
    id: 1,
    athlete: "Иван Петров",
    gender: "male",
    distanceKey,
    timeText: "00:18:30",
    timeSeconds: 1110,
    recordDate: "2026-05-10",
    protocolUrl: null,
    raceName: null,
    raceCity: null,
    ...overrides,
  };
}

describe("resultsUtils", () => {
  it("maps supported club records to result entries and skips invalid records", () => {
    const results = mapClubRecordsToResults([
      createClubRecord(),
      createClubRecord({
        id: 2,
        distanceKey: "21_1k",
        userName: "",
        userLastName: "Сидорова",
        userGender: "female",
        timeText: "01:24:00",
      }),
      createClubRecord({
        id: 3,
        distanceKey: "3k",
      }),
      createClubRecord({
        id: 4,
        timeText: "18:30",
      }),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: 1,
      athlete: "Иван Петров",
      gender: "male",
      distanceKey: "5k",
      timeSeconds: 1110.5,
    });
    expect(results[1]).toMatchObject({
      id: 2,
      athlete: "Сидорова",
      gender: "female",
      distanceKey: "21k",
      timeSeconds: 5040,
    });
  });

  it("maps all supported distance keys and nullable athlete metadata", () => {
    const results = mapClubRecordsToResults([
      createClubRecord({
        id: 5,
        distanceKey: "10k",
        userName: "  Анна  ",
        userLastName: "",
        userGender: "other",
        timeText: "00:40:00",
      }),
      createClubRecord({
        id: 6,
        distanceKey: "marathon",
        userName: "Мария",
        userLastName: null,
        userGender: " FEMALE ",
        timeText: "03:10:00.25",
      }),
    ]);

    expect(results).toEqual([
      expect.objectContaining({
        id: 5,
        athlete: "Анна",
        gender: null,
        distanceKey: "10k",
        timeSeconds: 2400,
      }),
      expect.objectContaining({
        id: 6,
        athlete: "Мария",
        gender: "female",
        distanceKey: "42k",
        timeSeconds: 11400.25,
      }),
    ]);
  });

  it("skips records with malformed time text", () => {
    const results = mapClubRecordsToResults([
      createClubRecord({ id: 10, timeText: "" }),
      createClubRecord({ id: 11, timeText: "bad:10:10" }),
      createClubRecord({ id: 12, timeText: "00:bad:10" }),
      createClubRecord({ id: 13, timeText: "00:10:bad" }),
      createClubRecord({ id: 14, timeText: "00:10:10." }),
      createClubRecord({ id: 15, timeText: "00:10:10.2.3" }),
    ]);

    expect(results).toEqual([]);
  });

  it("groups results by supported distance keys", () => {
    const grouped = groupResultsByDistance([
      createResult("5k", { id: 1 }),
      createResult("10k", { id: 2 }),
      createResult("5k", { id: 3 }),
    ]);

    expect(grouped["5k"].map((result) => result.id)).toEqual([1, 3]);
    expect(grouped["10k"].map((result) => result.id)).toEqual([2]);
    expect(grouped["21k"]).toEqual([]);
    expect(grouped["42k"]).toEqual([]);
  });

  it("formats result metadata for list display without coupling to markup", () => {
    expect(formatResultDate("2026-05-10")).toBe("10.05.2026");
    expect(formatResultDate("unknown")).toBe("unknown");

    expect(
      buildMetaItems(
        createResult("5k", {
          raceName: "Spring Run",
          raceCity: "Moscow",
          recordDate: "2026-05-10",
        })
      )
    ).toEqual(["Spring Run", "Moscow", "10.05.2026"]);
    expect(
      buildMetaItems(
        createResult("5k", {
          raceName: null,
          raceCity: null,
          recordDate: "",
        })
      )
    ).toEqual([]);
  });

  it("formats result count with Russian plural forms", () => {
    expect(formatResultsCount(0)).toBe("0 финишей");
    expect(formatResultsCount(1)).toBe("1 финиш");
    expect(formatResultsCount(2)).toBe("2 финиша");
    expect(formatResultsCount(5)).toBe("5 финишей");
    expect(formatResultsCount(11)).toBe("11 финишей");
    expect(formatResultsCount(21)).toBe("21 финиш");
  });

  it("sorts results by time, date, athlete and id", () => {
    const results = [
      createResult("5k", {
        id: 3,
        athlete: "Борис",
        timeSeconds: 1000,
        recordDate: "2026-05-11",
      }),
      createResult("5k", {
        id: 2,
        athlete: "Анна",
        timeSeconds: 1000,
        recordDate: "2026-05-11",
      }),
      createResult("5k", {
        id: 1,
        athlete: "Виктор",
        timeSeconds: 999,
        recordDate: "2026-05-12",
      }),
      createResult("5k", {
        id: 4,
        athlete: "Анна",
        timeSeconds: 1000,
        recordDate: "2026-05-12",
      }),
    ];

    expect(sortResults(results).map((result) => result.id)).toEqual([1, 2, 3, 4]);
  });

  it("sorts results by id when time, date and athlete match", () => {
    const results = [
      createResult("5k", { id: 2, athlete: "Анна", timeSeconds: 1000 }),
      createResult("5k", { id: 1, athlete: "Анна", timeSeconds: 1000 }),
    ];

    expect(sortResults(results).map((result) => result.id)).toEqual([1, 2]);
  });

  it("splits records into best records and other results using epsilon", () => {
    const { records, rest } = splitRecords([
      createResult("10k", {
        id: 1,
        timeSeconds: 2000,
      }),
      createResult("10k", {
        id: 2,
        timeSeconds: 2000.00005,
      }),
      createResult("10k", {
        id: 3,
        timeSeconds: 2001,
      }),
    ]);

    expect(records.map((result) => result.id)).toEqual([1, 2]);
    expect(rest.map((result) => result.id)).toEqual([3]);
  });

  it("returns empty split for empty results", () => {
    expect(splitRecords([])).toEqual({
      records: [],
      rest: [],
    });
  });
});
