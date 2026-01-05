export type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
};

export type WorkoutReport = {
  id: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText: string | null;
  distanceKm: string | null;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  weather: string | null;
  hasWind: boolean | null;
  temperatureC: string | null;
  surface: string | null;
};

export type WeightEntry = {
  id: number;
  date: string;
  period: string;
  weightKg: string;
};

export type RecoveryEntry = {
  id?: number;
  date: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  sleepHours: string | null;
};

export type DayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
  totalDistanceKm: number;
};

export type DayPayload = {
  planEntries: PlanEntry[];
  workoutReports: WorkoutReport[];
  weightEntries: WeightEntry[];
  recoveryEntry: RecoveryEntry;
  status: DayStatus;
  previousEveningWeightKg: string | null;
};

export type DiaryDayMap = Record<string, DayStatus>;

export type RecoveryForm = {
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  sleepHours: string;
};

export type WorkoutFormEntry = {
  startTime: string;
  resultText: string;
  commentText: string;
  distanceKm: string;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  weather: string;
  hasWind: string;
  temperatureC: string;
  surface: string;
};

export type WorkoutFormState = Record<number, WorkoutFormEntry>;

export type WeightFormState = {
  morning: string;
  evening: string;
};

export type SavingWeightState = {
  morning: boolean;
  evening: boolean;
};

export type SavingWorkoutsState = Record<number, boolean>;
