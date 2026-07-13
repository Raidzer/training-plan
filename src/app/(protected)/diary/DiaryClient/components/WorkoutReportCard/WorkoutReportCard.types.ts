export type WorkoutField =
  | "startTime"
  | "resultText"
  | "distanceKm"
  | "commentText"
  | "overallScore"
  | "functionalScore"
  | "muscleScore"
  | "weather"
  | "hasWind"
  | "temperatureC"
  | "surface"
  | "shoeIds"
  | "shoeMileageKm";

export type TextOption = {
  value: string;
  label: string;
};

export type ShoeOption = {
  value: number;
  label: string;
};
