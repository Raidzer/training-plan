import type { Dayjs } from "dayjs";

export type DayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
  totalDistanceKm: number;
};

export type PeriodTotals = {
  daysComplete: number;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  weightEntries: number;
};

export type DiaryPeriodApiResponse = {
  days?: DayStatus[];
  totals?: PeriodTotals;
  error?: string;
};

export type PeriodExportErrorResponse = {
  error?: string;
};

export type PeriodRange = [Dayjs, Dayjs];
