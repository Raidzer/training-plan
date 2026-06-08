import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useResultsFilters } from "@/app/results/ResultsClient/hooks/useResultsFilters";
import type {
  ResultsDistanceKey,
  ResultsEntry,
} from "@/app/results/ResultsClient/types/resultsTypes";

function createResult(
  distanceKey: ResultsDistanceKey,
  overrides: Partial<ResultsEntry> = {}
): ResultsEntry {
  return {
    id: 1,
    athlete: "Иван Петров",
    gender: "male",
    distanceKey,
    timeText: "00:18:00",
    timeSeconds: 1080,
    recordDate: "2026-05-10",
    raceName: null,
    raceCity: null,
    protocolUrl: null,
    ...overrides,
  };
}

describe("useResultsFilters", () => {
  it("returns sorted records and rest for the active distance", () => {
    const { result } = renderHook(() =>
      useResultsFilters([
        createResult("5k", {
          id: 1,
          timeSeconds: 1100,
        }),
        createResult("10k", {
          id: 2,
          timeSeconds: 2000,
        }),
        createResult("5k", {
          id: 3,
          timeSeconds: 1000,
        }),
      ])
    );

    expect(result.current.activeDistance).toBe("5k");
    expect(result.current.activeLabel).toBe("5 км");
    expect(result.current.sortedResults.map((item) => item.id)).toEqual([3, 1]);
    expect(result.current.records.map((item) => item.id)).toEqual([3]);
    expect(result.current.rest.map((item) => item.id)).toEqual([1]);
  });

  it("filters results by distance and gender", () => {
    const { result } = renderHook(() =>
      useResultsFilters([
        createResult("5k", {
          id: 1,
          gender: "male",
        }),
        createResult("5k", {
          id: 2,
          gender: "female",
        }),
        createResult("21k", {
          id: 3,
          gender: "female",
        }),
      ])
    );

    act(() => {
      result.current.setActiveGender("female");
    });

    expect(result.current.sortedResults.map((item) => item.id)).toEqual([2]);

    act(() => {
      result.current.setActiveDistance("21k");
    });

    expect(result.current.activeLabel).toBe("21 км");
    expect(result.current.sortedResults.map((item) => item.id)).toEqual([3]);
  });
});
