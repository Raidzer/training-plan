import { hasReportableWorkoutTask } from "@/shared/utils/diaryUtils";

import type { PlanDayEntry, PlanDraftEntry, PlanEntry } from "../types/planTypes";

export type {
  PlanDayEntry,
  PlanDayWorkout,
  PlanDraft,
  PlanDraftEntry,
  PlanEntry,
} from "../types/planTypes";

const SHORT_WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;
const LONG_WEEKDAYS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
] as const;
const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

export const createEmptyDraftEntry = (): PlanDraftEntry => ({
  taskText: "",
  commentText: "",
  hasReport: false,
});

export const buildPlanDays = (entries: PlanEntry[]): PlanDayEntry[] => {
  const grouped = new Map<string, PlanEntry[]>();
  for (const entry of entries) {
    const existing = grouped.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.date, [entry]);
    }
  }

  const rows: PlanDayEntry[] = [];
  for (const [date, dayEntries] of grouped) {
    const sorted = dayEntries
      .filter((entry) => hasReportableWorkoutTask(entry.taskText))
      .sort((a, b) => a.sessionOrder - b.sessionOrder);
    const reportedWorkoutCount = sorted.filter((entry) => entry.hasReport).length;
    rows.push({
      date,
      workouts: sorted.map((entry) => ({
        id: entry.id,
        sessionOrder: entry.sessionOrder,
        taskText: entry.taskText,
        commentText: entry.commentText,
        hasReport: entry.hasReport,
      })),
      isWorkload: sorted.some((entry) => entry.isWorkload),
      hasAnyReport: reportedWorkoutCount > 0,
      hasAllReports: reportedWorkoutCount === sorted.length,
      reportedWorkoutCount,
      workoutCount: sorted.length,
    });
  }
  return rows;
};

export const sortPlanEntries = (items: PlanEntry[]) =>
  [...items].sort((a, b) => {
    if (a.date === b.date) {
      return a.sessionOrder - b.sessionOrder;
    }
    return b.date.localeCompare(a.date);
  });

export type PlanDateParts = {
  dateLabel: string;
  yearLabel: string;
  weekdayLabel: string;
  shortWeekdayLabel: string;
  weekdayIndex: number;
};

export const getPlanDateParts = (dateStr: string): PlanDateParts => {
  const date = new Date(dateStr + "T00:00:00.000Z");
  const weekday = date.getUTCDay();

  return {
    dateLabel: date.getUTCDate() + " " + MONTHS_GENITIVE[date.getUTCMonth()],
    yearLabel: String(date.getUTCFullYear()),
    weekdayLabel: LONG_WEEKDAYS[weekday],
    shortWeekdayLabel: SHORT_WEEKDAYS[weekday],
    weekdayIndex: (weekday + 6) % 7,
  };
};

export const formatDateWithWeekday = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return dateStr + " (" + SHORT_WEEKDAYS[date.getUTCDay()] + ")";
};
