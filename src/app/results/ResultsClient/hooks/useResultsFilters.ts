"use client";

import { useMemo, useState } from "react";
import { DISTANCE_LABEL_BY_KEY } from "../constants/resultsConstants";
import type { GenderTabKey, ResultsDistanceKey, ResultsEntry } from "../types/resultsTypes";
import { sortResults, splitRecords } from "../utils/resultsUtils";

export const useResultsFilters = (results: ResultsEntry[]) => {
  const [activeDistance, setActiveDistance] = useState<ResultsDistanceKey>("5k");
  const [activeGender, setActiveGender] = useState<GenderTabKey>("all");
  const activeLabel = DISTANCE_LABEL_BY_KEY[activeDistance];
  const { records, rest, sortedResults } = useMemo(() => {
    const filtered = results.filter((item) => {
      if (item.distanceKey !== activeDistance) {
        return false;
      }

      if (activeGender === "all") {
        return true;
      }

      return item.gender === activeGender;
    });
    const sortedResults = sortResults(filtered);
    const { records, rest } = splitRecords(sortedResults);

    return { records, rest, sortedResults };
  }, [activeDistance, activeGender, results]);

  return {
    activeDistance,
    activeGender,
    activeLabel,
    records,
    rest,
    sortedResults,
    setActiveDistance,
    setActiveGender,
  };
};
