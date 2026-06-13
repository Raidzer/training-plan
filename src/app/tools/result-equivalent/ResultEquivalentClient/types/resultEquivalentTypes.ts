import type { ChangeEvent } from "react";

export type DistancePreset = {
  value: number;
  label: string;
  shortLabel: string;
};

export type PredictionMethod = "riegel" | "cameron" | "daniels";

export type PredictionMethodOption = {
  value: PredictionMethod;
  label: string;
  description: string;
};

export type EquivalentResult = {
  distanceMeters: number;
  distanceLabel: string;
  resultTime: string;
  paceTime: string;
  isSourceDistance: boolean;
};

export type UseResultEquivalentReturn = {
  sourceDistance: number;
  sourceDistanceInputValue: string;
  sourceTime: string;
  predictionMethod: PredictionMethod;
  predictionMethodDescription: string;
  equivalents: EquivalentResult[];
  handleSourceDistanceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSourceDistanceClear: () => void;
  handleSourceDistancePreset: (value: number) => void;
  handleSourceTimeChange: (value: string) => void;
  handlePredictionMethodChange: (value: PredictionMethod) => void;
};
