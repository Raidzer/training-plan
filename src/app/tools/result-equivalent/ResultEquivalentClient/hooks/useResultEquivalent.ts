import { useMemo, useState, type ChangeEvent } from "react";
import {
  DEFAULT_SOURCE_DISTANCE,
  DEFAULT_SOURCE_TIME,
  DEFAULT_PREDICTION_METHOD,
  PREDICTION_METHODS,
  TARGET_DISTANCES,
} from "../constants/resultEquivalentConstants";
import type {
  EquivalentResult,
  PredictionMethod,
  UseResultEquivalentReturn,
} from "../types/resultEquivalentTypes";
import {
  calculateEquivalentSeconds,
  formatPace,
  formatTime,
  normalizeDistanceInputValue,
  parseTimeInputToSeconds,
  toNonNegativeInt,
} from "../utils/resultEquivalentUtils";

export const useResultEquivalent = (): UseResultEquivalentReturn => {
  const [sourceDistance, setSourceDistance] = useState(DEFAULT_SOURCE_DISTANCE);
  const [sourceDistanceInputValue, setSourceDistanceInputValue] = useState(
    String(DEFAULT_SOURCE_DISTANCE)
  );
  const [sourceTime, setSourceTime] = useState(DEFAULT_SOURCE_TIME);
  const [predictionMethod, setPredictionMethod] =
    useState<PredictionMethod>(DEFAULT_PREDICTION_METHOD);

  const sourceSeconds = useMemo(() => parseTimeInputToSeconds(sourceTime), [sourceTime]);
  const predictionMethodDescription = useMemo(() => {
    const method = PREDICTION_METHODS.find((item) => item.value === predictionMethod);

    if (!method) {
      return "";
    }

    return method.description;
  }, [predictionMethod]);

  const equivalents = useMemo<EquivalentResult[]>(() => {
    if (sourceDistance <= 0 || sourceSeconds <= 0) {
      return [];
    }

    return TARGET_DISTANCES.map((distance) => {
      const equivalentSeconds = calculateEquivalentSeconds(
        predictionMethod,
        sourceSeconds,
        sourceDistance,
        distance.value
      );

      return {
        distanceMeters: distance.value,
        distanceLabel: distance.shortLabel,
        resultTime: formatTime(equivalentSeconds),
        paceTime: formatPace(equivalentSeconds, distance.value),
        isSourceDistance: distance.value === sourceDistance,
      };
    });
  }, [predictionMethod, sourceDistance, sourceSeconds]);

  const handleSourceDistanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextInputValue = normalizeDistanceInputValue(event.target.value);
    const nextDistance = toNonNegativeInt(nextInputValue);

    setSourceDistanceInputValue(nextInputValue);
    setSourceDistance(nextDistance);
  };

  const handleSourceDistanceClear = () => {
    setSourceDistanceInputValue("");
    setSourceDistance(0);
  };

  const handleSourceDistancePreset = (value: number) => {
    setSourceDistance(value);
    setSourceDistanceInputValue(String(value));
  };

  const handleSourceTimeChange = (value: string) => {
    setSourceTime(value);
  };

  const handlePredictionMethodChange = (value: PredictionMethod) => {
    setPredictionMethod(value);
  };

  return {
    sourceDistance,
    sourceDistanceInputValue,
    sourceTime,
    predictionMethod,
    predictionMethodDescription,
    equivalents,
    handleSourceDistanceChange,
    handleSourceDistanceClear,
    handleSourceDistancePreset,
    handleSourceTimeChange,
    handlePredictionMethodChange,
  };
};
