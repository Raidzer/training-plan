import type { PeriodTotals } from "../types/periodTypes";

export const DIARY_PERIOD_LABELS = {
  title: "Дневник за период",
  subtitle: "Просмотр заполнения дневника за выбранный период.",
  backToDiary: "Назад к дневному виду",
  backHome: "На главную",
  lastSevenDays: "Последние 7 дней",
  lastThirtyDays: "Последние 30 дней",
  exportExcel: "Выгрузить Excel",
  exportAllExcel: "Выгрузить весь дневник",
  loadFail: "Не удалось загрузить дневник за период.",
  exportFail: "Не удалось выгрузить отчет.",
  completedStatus: "Заполнено",
  incompleteStatus: "Не заполнено",
  dateColumn: "Дата",
  weightColumn: "Вес",
  distanceColumn: "Дистанция, км",
  recoveryColumn: "Восстановление",
  workoutsColumn: "Тренировки",
  statusColumn: "Статус",
  distanceMetric: "Дистанция",
} as const;

export const INITIAL_PERIOD_TOTALS: PeriodTotals = {
  daysComplete: 0,
  workoutsTotal: 0,
  workoutsWithFullReport: 0,
  weightEntries: 0,
};

export const PERIOD_SUMMARY_ITEMS = [
  { key: "daysComplete", label: "Дней заполнено" },
  { key: "workoutsTotal", label: "Тренировок всего" },
  { key: "workoutsWithFullReport", label: "Тренировок с полным отчетом" },
  { key: "weightEntries", label: "Записей веса" },
] satisfies Array<{ key: keyof PeriodTotals; label: string }>;
