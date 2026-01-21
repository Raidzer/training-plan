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
