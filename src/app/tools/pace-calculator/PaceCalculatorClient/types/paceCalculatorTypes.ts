import type { ChangeEvent } from "react";

export type LastEdited = "result" | "pace" | "lap";

export type SplitItem = {
  label: string;
  time: string;
};

export type SavedResult = {
  id: string;
  distanceMeters: number;
  resultSeconds: number;
  paceSeconds: number;
  lapSeconds: number;
  createdAt: string;
};

export type UsePaceCalculatorReturn = {
  distance: number;
  resultHours: number;
  resultMinutes: number;
  resultSeconds: number;
  paceMinutes: number;
  paceSeconds: number;
  lapMinutes: number;
  lapSeconds: number;
  distanceInputValue: string;
  splits: SplitItem[];
  savedResults: SavedResult[];
  canSave: boolean;
  handleDistanceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDistanceClear: () => void;
  handleDistancePreset: (value: number) => void;
  formatSplitTime: (seconds: number) => string;
  getSavedDistanceLabel: (meters: number) => string;
  resultTimeString: string;
  paceTimeString: string;
  lapTimeString: string;
  handleResultTimeChange: (value: string) => void;
  handlePaceTimeChange: (value: string) => void;
  handleLapTimeChange: (value: string) => void;
  handleSaveResult: () => void;
  handleDeleteResult: (id: string) => void;
};
