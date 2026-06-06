import type { DistanceTab, GenderTab } from "../types/resultsTypes";

export const RESULTS_LABELS = {
  title: "Результаты клуба",
  subtitle:
    "Быстрые финиши участников по ключевым дистанциям. Сортировка внутри каждой дистанции - от рекордов к полному списку.",
  distanceFilterLabel: "Выбор дистанции",
  genderFilterLabel: "Фильтр по полу",
  panelTitlePrefix: "Дистанция",
  panelSubtitle: "Результаты отсортированы по времени - от быстрого к медленному.",
  emptyText: "Пока нет результатов для этой дистанции.",
  recordsTitle: "Рекорды",
  recordsSubtitle: "Самые быстрые результаты на выбранной дистанции.",
  recordBadge: "Рекорд",
  restTitle: "Остальные результаты",
  restSubtitle: "Полный список финишей на дистанции.",
  protocolLink: "Протокол",
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
