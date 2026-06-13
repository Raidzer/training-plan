import type { DistancePreset, PredictionMethodOption } from "../types/resultEquivalentTypes";

export const RIEGEL_EXPONENT = 1.06;
export const DEFAULT_SOURCE_DISTANCE = 5000;
export const DEFAULT_SOURCE_TIME = "00:20:00";
export const DEFAULT_PREDICTION_METHOD = "riegel" as const;

export const DISTANCE_PRESETS: DistancePreset[] = [
  { value: 1000, label: "1 000 м", shortLabel: "1 км" },
  { value: 1500, label: "1 500 м", shortLabel: "1,5 км" },
  { value: 3000, label: "3 000 м", shortLabel: "3 км" },
  { value: 5000, label: "5 000 м", shortLabel: "5 км" },
  { value: 10000, label: "10 000 м", shortLabel: "10 км" },
  { value: 21097, label: "21 097 м", shortLabel: "Полумарафон" },
  { value: 42195, label: "42 195 м", shortLabel: "Марафон" },
];

export const TARGET_DISTANCES: DistancePreset[] = [
  { value: 1000, label: "1 000 м", shortLabel: "1 км" },
  { value: 3000, label: "3 000 м", shortLabel: "3 км" },
  { value: 5000, label: "5 000 м", shortLabel: "5 км" },
  { value: 10000, label: "10 000 м", shortLabel: "10 км" },
  { value: 15000, label: "15 000 м", shortLabel: "15 км" },
  { value: 21097, label: "21 097 м", shortLabel: "Полумарафон" },
  { value: 42195, label: "42 195 м", shortLabel: "Марафон" },
];

export const PREDICTION_METHODS: PredictionMethodOption[] = [
  {
    value: "riegel",
    label: "Ригель",
    description: "Степенная модель для быстрого прогноза между дистанциями.",
  },
  {
    value: "cameron",
    label: "Cameron",
    description: "Регрессионная модель, которая обычно осторожнее переносит результат на марафон.",
  },
  {
    value: "daniels",
    label: "Daniels/VDOT",
    description: "Модель через VDOT: кислородная стоимость темпа и устойчивую долю VO2max.",
  },
];

export const RESULT_EQUIVALENT_TEXT = {
  header: {
    title: "Калькулятор прогноза результата",
    description:
      "Оценивает, какой результат можно ожидать на других дистанциях, если текущая форма соответствует введенному забегу.",
    hint: "Выберите исходную дистанцию, введите результат и сравните прогноз на популярных дистанциях.",
  },
  input: {
    title: "Исходный результат",
    distanceLabel: "Дистанция:",
    distanceHint: "Введите дистанцию в метрах или выберите быстрый пресет",
    distanceAriaLabel: "Исходная дистанция в метрах",
    distanceClear: "Очистить исходную дистанцию",
    distanceUnit: "м",
    resultLabel: "Результат:",
    resultAriaLabel: "Исходный результат",
    methodLabel: "Методика:",
    methodAriaLabel: "Методика расчета",
    formulaNote:
      "Это ориентир, а не гарантия: профиль трассы, погода и подготовка могут заметно менять итог.",
  },
  table: {
    title: "Прогноз результатов",
    hint: "Прогноз на популярные дистанции при сопоставимом уровне готовности.",
    distanceColumn: "Дистанция",
    resultColumn: "Прогноз",
    paceColumn: "Темп",
    empty: "Введите дистанцию и результат, чтобы увидеть прогноз.",
    sameDistance: "исходная",
  },
} as const;
