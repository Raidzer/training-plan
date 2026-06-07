import { describe, expect, it } from "vitest";

import {
  buildMetaItems,
  formatResultDate,
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
});
