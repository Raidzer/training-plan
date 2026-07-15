import type { PeriodTotals } from "../types/periodTypes";

export const DIARY_PERIOD_LABELS = {
  eyebrow: "Дневник",
  title: "Дневник за период",
  subtitle: "Сводка ежедневных отчётов, тренировок и восстановления за выбранные даты.",
  dailyReportAction: "Ежедневный отчёт",
  dashboardAction: "Личный кабинет",
  rangeTitle: "Период отчёта",
  rangeSubtitle: "Выберите даты вручную или используйте быстрый интервал.",
  rangeLabel: "Диапазон дат",
  quickRangeLabel: "Быстрый выбор",
  exportLabel: "Экспорт данных",
  lastSevenDays: "Последние 7 дней",
  lastThirtyDays: "Последние 30 дней",
  exportExcel: "Выгрузить выбранный период",
  exportAllExcel: "Выгрузить весь дневник",
  summaryTitle: "Сводка за период",
  resultsTitle: "Дни периода",
  resultsSubtitle: "Заполнение ключевых показателей по каждому дню.",
  loadingLabel: "Загружаем данные за выбранный период.",
  errorTitle: "Не удалось загрузить период",
  emptyTitle: "За этот период нет данных",
  emptyDescription: "Измените диапазон дат и повторите поиск.",
  retryAction: "Повторить",
  daysCountSuffix: "дн.",
  loadFail: "Не удалось загрузить дневник за период.",
  exportFail: "Не удалось выгрузить отчёт.",
  completedStatus: "Заполнено",
  incompleteStatus: "Не заполнено",
  dateColumn: "Дата",
  weightColumn: "Вес, утро / вечер",
  distanceColumn: "Дистанция, км",
  recoveryColumn: "Баня / МФР / массаж",
  workoutsColumn: "Отчёты о тренировках",
  sleepColumn: "Сон",
  sleepCompleted: "Заполнено",
  sleepMissing: "Не заполнено",
  statusColumn: "Статус",
  distanceMetric: "Дистанция",
  openDayAction: "Открыть отчёт",
} as const;

export const INITIAL_PERIOD_TOTALS: PeriodTotals = {
  daysComplete: 0,
  workoutsTotal: 0,
  workoutsWithFullReport: 0,
  weightEntries: 0,
};

export const PERIOD_SUMMARY_ITEMS = [
  {
    key: "daysComplete",
    label: "Дней заполнено",
    detail: (_totals: PeriodTotals, daysCount: number) => `из ${daysCount}`,
  },
  {
    key: "workoutsWithFullReport",
    label: "Полных отчётов",
    detail: (totals: PeriodTotals) => `из ${totals.workoutsTotal} тренировок`,
  },
  {
    key: "workoutsTotal",
    label: "Тренировок всего",
    detail: "За выбранный период",
  },
  {
    key: "weightEntries",
    label: "Записей веса",
    detail: "Утренние и вечерние",
  },
] satisfies Array<{
  key: keyof PeriodTotals;
  label: string;
  detail: string | ((totals: PeriodTotals, daysCount: number) => string);
}>;
