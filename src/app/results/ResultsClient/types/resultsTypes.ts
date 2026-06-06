export type ResultsDistanceKey = "5k" | "10k" | "21k" | "42k";
export type ResultsGender = "male" | "female";

export type ResultsEntry = {
  id: number;
  distanceKey: ResultsDistanceKey;
  athlete: string;
  gender: ResultsGender | null;
  timeText: string;
  timeSeconds: number;
  recordDate: string;
  raceName: string | null;
  raceCity: string | null;
  protocolUrl: string | null;
};

export type DistanceTab = {
  key: ResultsDistanceKey;
  label: string;
};

export type GenderTabKey = "all" | ResultsGender;

export type GenderTab = {
  key: GenderTabKey;
  label: string;
};

export type ResultsClientProps = {
  results: ResultsEntry[];
};

export type SplitResults = {
  records: ResultsEntry[];
  rest: ResultsEntry[];
};
