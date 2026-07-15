import type { DistanceTab, GenderTab } from "../types/resultsTypes";

export const RESULTS_LABELS = {
  eyebrow: "Клубная статистика",
  title: "Результаты клуба",
  subtitle: "Финиши участников на ключевых дистанциях — от клубного рекорда к полному рейтингу.",
  totalResultsStat: "Всего финишей",
  distancesStat: "Дистанции",
  distanceFilterLabel: "Выбор дистанции",
  genderFilterLabel: "Фильтр по полу",
  panelEyebrow: "Рейтинг дистанции",
  panelTitlePrefix: "Финиши на",
  panelSubtitle: "От самого быстрого результата к более продолжительным финишам.",
  resultCountOne: "финиш",
  resultCountFew: "финиша",
  resultCountMany: "финишей",
  emptyTitle: "На этом срезе пока нет финишей",
  emptyText: "Пока нет результатов для этой дистанции.",
  emptyGuidance: "Выберите другую дистанцию или измените фильтр по полу.",
  recordsTitle: "Лучшее время",
  recordsSubtitle: "Клубный ориентир на выбранной дистанции.",
  recordBadge: "Рекорд дистанции",
  restTitle: "Полный рейтинг",
  restSubtitle: "Остальные финиши в порядке результата.",
  protocolLink: "Протокол",
  rankColumn: "Место",
  athleteColumn: "Участник и старт",
  timeColumn: "Время",
  protocolColumn: "Источник",
} as const;

export const DISTANCE_TABS: readonly DistanceTab[] = [
  { key: "5k", label: "5 км" },
  { key: "10k", label: "10 км" },
  { key: "21k", label: "21 км" },
  { key: "42k", label: "42 км" },
];

export const DISTANCE_LABEL_BY_KEY = {
  "5k": "5 км",
  "10k": "10 км",
  "21k": "21 км",
  "42k": "42 км",
} as const;

export const GENDER_TABS: readonly GenderTab[] = [
  { key: "all", label: "Все" },
  { key: "male", label: "Мужчины" },
  { key: "female", label: "Женщины" },
];

export const GENDER_LABEL_BY_KEY = {
  all: "Все",
  male: "Мужчины",
  female: "Женщины",
} as const;

export const RESULTS_PANEL_ID = "results-panel";

export const RESULTS_TIME_EPSILON = 0.0001;
